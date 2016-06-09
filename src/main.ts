import * as $ from 'jquery';
import * as d3 from 'd3';
import { Selection } from 'd3';
import * as _ from 'lodash';
import './conversations.scss';
import './index.html';
import { Stream, Headline, SelectedComponent, StreamEntry, valueOnDate } from './models';
import { closestPoint } from './functions';

const target            = d3.select( '.target' ),
      dateDiv           = $( '.date' ),

      headlineDiv       = $( '.headline' ),


      margin            = { top: 55, right: 10, bottom: 50, left: 10 },
      padding           = 5,

      windowWid         = $( document ).width(),
      windowHt          = $( document ).height(),

      svgHt             = windowHt - margin.top - margin.bottom,
      svgWid            = windowWid - margin.left - margin.right,

      toX               = d3.time.scale().range( [ 0, svgWid - padding ] ),
      toY               = d3.scale.linear()
                            .domain( [ 0, 1 ] ) // we already know the domain of this bc we're normalizing
                            .range( [ svgHt - padding, 0 ] ),


      svg               = target.append( 'svg' )
                                .attr( 'height', svgHt )
                                .attr( 'width', svgWid ),

      inputDateFormat   = d3.time.format( '%Y-%m-%d' ),
      displayDateFormat = d3.time.format( '%a, %B %e ' ),
      hlDateFormat      = d3.time.format( '%m/%d/%Y' ),

      curve             = d3.svg.line()
                            .interpolate( "basis" )
                            .x( d => toX( d.date ) )
                            .y( d => toY( d.normValue ) ),

      selectedComponents: SelectedComponent[] = [],

      aggStream         = svg.append( 'g' )
                             .attr( 'class', 'aggregate stream' )
                             .append( 'path' );


d3.json( './data-final.json', (error, rawData)=> {
  const streamData        = prepStreamData( rawData.streams ),
        streams: Stream[] = <Stream[]> _.values( streamData ),
        headlines         = prepHeadlineData( rawData.headlines ),
        redraw            = genRedrawFxn( streamData ),
        addHandlers       = genAddHandlerFxn( streamData, redraw ),
        minDate           = d3.min( streams, stream => d3.min( stream.values, entry => entry.date ) ),
        maxDate           = d3.max( streams, stream => d3.max( stream.values, entry => entry.date ) );

  toX.domain( [ minDate, maxDate ] )


  const gs: Selection<Stream> = svg.selectAll( '.stream' ).data( streams )
                                   .enter()
                                   .append( 'g' )
                                   .attr( 'class', (d)=>`stream ${d.name}` ),

        paths                 = gs.append( 'path' )
                                  .attr( "d", d => curve( d.values ) )
                                  .each( d => addHandlers( d.name ) ),

        // dots = gs.append( 'circle' )
        //               .attr( 'class', d => `dot ${d.name}` )
        //               .attr( 'r', '3' )
        //               .attr('cx', 0)
        //               .attr('cy', 50)             ,

        dot                   = svg.append( 'circle' )
                                   .attr( 'class', d => `dot` )
                                   .attr( 'r', '3' )
                                   .attr( 'cx', 0 )
                                   .attr( 'cy', 50 ),


        officialPath          = svg.select( '.stream.official path ' );


  svg.on( "mousemove", function () {
    let m = d3.mouse( this ),
        y = closestPoint( officialPath.node(), m );

    dot.attr( 'cx', y[ 0 ] )
       .attr( 'cy', y[ 1 ] );

    setText( y[ 0 ] );

  } )

  animatePathOn( officialPath );


  function setText(x: number) {
    let date     = toX.invert( x ),
        headline = findClosestHeadlineDate( date );

    dateDiv.text( displayDateFormat( headline.date ) );
    headlineDiv.text( headline.headline );


    function findClosestHeadlineDate(date: Date): Headline {
      let i = 0;
      for (; i < headlines.length && headlines[ i ].date < date; i++) { }
      console.log()
      return headlines[ i ];

    }

  }


} );


function genAddHandlerFxn(data, redraw: ()=>void): (name: string)=> void {

  return (name: string) => {
    addStreamHoverHandlers( name );
    addStreamClickHandlers( name );
  }

  function addStreamHoverHandlers(name: string): void {
    $( `.${name}.entry` ).hover( ()=> {
          //on mouseover
          $( `g.${name}` ).addClass( 'visible' );
          $( '.target' ).addClass( 'hovered' );
        }, ()=> {
          //on mouseout
          $( `g.${name}` ).removeClass( 'visible' );
          $( '.target' ).removeClass( 'hovered' )
        }
    )

  }

  function addStreamClickHandlers(name: string) {

    $( `.entry .title.${name}` ).click( ()=> {
      if (!hasName( selectedComponents, name )) {
        selectedComponents.push( { streamName: name, weight: 1 } );
        $( `.weight.${name}` ).removeClass( 'active' )
        $( `.title.${name}` ).removeClass( 'active' )

      } else {
        _.remove( selectedComponents, (comp)=> comp.streamName === name );
        $( `.weight.${name}` ).removeClass( 'active' )
        $( `.title.${name}` ).removeClass( 'active' )
      }
      redraw();
    } )

  }

}


function genRedrawFxn(data): ()=> void {
  const recalc = genRecalcFxn( data );

  return ()=> {
    aggStream
        .transition().duration( 500 )
        .attr( "d", curve( recalc() ) );
  }
}


function genRecalcFxn(data) {
  return function recalculateAggregateStream(): StreamEntry[] {

    //temporary hack to only use shared dates
    let sharedDates = _.intersection( selectedComponents.map( comp=>
        data[ comp.streamName ].values.map( entry => entry.date )
    ) )[ 0 ];

    return sharedDates.map( date => {
      let values = selectedComponents.reduce( (result, comp)=> {
        let value = valueOnDate( data[ comp.streamName ], date );
        for (let i = 0; i < comp.weight; i++) {
          result.push( value );
        }
        return result;
      }, [] );
      let mergedValue = values.reduce( (sum, next)=>sum + next ) / values.length;

      return {
        date     : date,
        value    : mergedValue,
        normValue: mergedValue
      }

    } );

  }
}


function prepStreamData(input: any): {[id: string]: Stream} {

  let streams: Stream[]              = <Stream[]> input,
      output: {[id: string]: Stream} = {};

  return streams.reduce( (result, next)=> {

    let min       = d3.min( next.values, function (d) { return d.value } ),
        max       = d3.max( next.values, function (d) { return d.value } ),
        normalize = d3.scale.linear()
                      .domain( [ min, max ] )
                      .range( [ 0, 1 ] );

    result[ next.name ] = {
      name  : next.name,
      values: next.values.map( entry => ({
        value    : entry.value,
        normValue: normalize( entry.value ),
        date     : inputDateFormat.parse( entry.date )
      }) ).sort( (x, y)=> x.date - y.date )
    }

    return result;

  }, output );

}


function prepHeadlineData(raw: any[]): Headline[] {
  return raw.map( it=> ({
    headline: it.headline,
    date    : hlDateFormat.parse( it.date )
  }) ).sort( (x, y)=> x.date - y.date )

}

function animatePath(path: Selection<any>, on: boolean = true, duration: number = 750) {
  let totalLength   = path.node().getTotalLength(),
      fromDashArray = on ? totalLength : 0,
      toDashArray   = on ? 0 : totalLength;

  path.attr( "stroke-dasharray", totalLength + " " + totalLength )
      .attr( "stroke-dashoffset", fromDashArray )
      .transition()
      .duration( duration || 750 )
      .ease( "sine" )
      .attr( "stroke-dashoffset", toDashArray );

}

function animatePathOn(path: Selection<any>, duratrion?: number) {
  animatePath( path, true, duratrion )
}

function animatePathOff(path: Selection<any>, duratrion?: number) {
  animatePath( path, false, duratrion )

}


function hasName(arr: SelectedComponent[], name: string): boolean {
  return _.some( arr, function (cmp) { return cmp.streamName === name} );
}