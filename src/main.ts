import * as $ from 'jquery';
import * as d3 from 'd3';
import { Selection } from 'd3';
import * as _ from 'lodash';
import './conversations.scss';
import './index.html';
import './data-final.json';
import { Stream, Headline, SelectedComponent, StreamEntry, valueOnDate } from './models';


const target                                  = d3.select( '.target' ),
      dateDiv                                 = $( '.date' ),

      headlineDiv                             = $( '.headline' ),


      margin                                  = { top: 50, right: 0, bottom: 20, left: 0 },
      padding                                 = 5,

      windowWid                               = $( document ).width(),
      windowHt                                = $( document ).height(),

      svgHt                                   = windowHt - margin.top - margin.bottom,
      svgWid                                  = windowWid - margin.left - margin.right,

      toX                                     = d3.time.scale().range( [ 0, svgWid - padding ] ),
      toY                                     = d3.scale.linear()
                                                  .domain( [ 0, 1 ] ) // we already know the domain of this bc we're normalizing
                                                  .range( [ svgHt - padding, 0 ] ),


      svg                                     = target.append( 'svg' )
                                                      .attr( 'height', svgHt )
                                                      .attr( 'width', svgWid ),

      inputDateFormat                         = d3.time.format( '%Y-%m-%d' ),
      displayDateFormat                       = d3.time.format( '%a, %B %e ' ),

      curve                                   = d3.svg.line()
                                                  .interpolate( "basis" )
                                                  .x( d => toX( d.date ) )
                                                  .y( d => toY( d.normValue ) ),
      xAxis                                   = d3.svg.axis()
                                                  .scale( toX )
                                                  .orient( "bottom" )
                                                  .ticks( d3.time.weeks, 2 )
                                                  .tickSize( -(svgHt-90), 1 )
                                                  .tickFormat( d3.time.format( "%B %e" ) ),

      selectedComponents: SelectedComponent[] = [],

      aggStream                               = svg.append( 'g' )
                                                   .attr( 'class', 'aggregate stream' )
                                                   .append( 'path' );


d3.json( './data-final.json', (error, rawData)=> {
  const streamData        = prepStreamData( rawData.streams ),
        streams: Stream[] = <Stream[]> _.values( streamData ),
        headlines         = prepHeadlineData( rawData.headlines ),
        updateViz         = getUpdateFxn( streamData ),
        addHandlers       = genAddHandlerFxn( streamData, updateViz ),
        minDate           = d3.min( streams, stream => d3.min( stream.values, entry => entry.date ) ),
        maxDate           = d3.max( streams, stream => d3.max( stream.values, entry => entry.date ) );

  toX.domain( [ minDate, maxDate ] );


  svg.append( "g" )
     .attr( "class", "x axis" )
     .attr( "transform", "translate(0," + svgHt + ")" )
     .call( xAxis )
     .selectAll( ".tick text" )
     .style( "text-anchor", "start" )
     .attr( "x", 6 )
     .attr( "y", 6 );


  const gs: Selection<Stream> = svg.selectAll( '.stream' ).data( streams )
                                   .enter()
                                   .append( 'g' )
                                   .attr( 'class', (d)=>`stream ${d.name}` ),

        paths                 = gs.append( 'path' )
                                  .attr( "d", d => curve( d.values ) )
                                  .each( d => addHandlers( d.name ) ),
        officialPath          = svg.select( '.stream.official path ' );


  svg.on( "mousemove", function () {
    let m = d3.mouse( this );

    setText( m[ 0 ] );

  } );

  animatePathOn( officialPath );


  function setText(x: number) {
    let date     = toX.invert( x ),
        headline = findClosestHeadlineDate( date );

    dateDiv.html( displayDateFormat( headline.date ) );
    headlineDiv.html( `<a href="${headline.url}" target="_blank">${headline.headline}</a> ` );

    // headlineDiv.html( `${headline.headline}` );

    function findClosestHeadlineDate(date: Date): Headline {
      let i = 0;
      for (; i < headlines.length && headlines[ i ].date < date; i++) { }
      console.log()
      return headlines[ i ];

    }

  }


} );

/**
 * aggStream is the output of the user's algorithm
 *  officialStream is what we're comparing it to
 */
function calcLSR(officialStream: StreamEntry[], aggStream: StreamEntry[]) {
  var Variance = 0;
  var singleVar = 0;
  for (var inc = 0; inc < officialStream.length; inc++) {
    singleVar = officialStream[ inc ].normValue + aggStream[ inc ].normValue;
    singleVar = singleVar * singleVar;
    Variance = Variance + singleVar;
  }
  return Math.round( Variance );
}


function genAddHandlerFxn(data, update: ()=>void): (name: string)=> void {

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
        $( `.entry.${name}` ).addClass( 'active' )
        $( `.title.${name}` ).addClass( 'active' )

      } else {
        _.remove( selectedComponents, (comp)=> comp.streamName === name );
        $( `.entry.${name}` ).removeClass( 'active' )
        $( `.title.${name}` ).removeClass( 'active' )
        $( `.${name}.weight` ).text( '' );

        if (selectedComponents.length == 0) {
          //  aggStream.attr('d', '')
        }

      }
      //   $( `.stream` ).removeClass( 'visible' );
      update();
    } );

    $( `.${name}.up` ).click( ()=> {
      adjustWeight( name, 1 );
      if (getStreamWeight( name ) > 1) {
        $( `.${name}.weight` ).html( `<span class="times">x</span>${getStreamWeight( name )}` );
      }
      update();
    } );

    $( `.${name}.down` ).click( ()=> {
      let curr = getStreamWeight( name );
      if (curr <= 1) {
        //if setting it to 0, deactivate 
        adjustWeight( name, -1 );
        $( `.${name}.weight` ).text( '' );
        _.remove( selectedComponents, (comp)=> comp.streamName === name );
        $( `.entry.${name}` ).removeClass( 'active' );
        $( `.title.${name}` ).removeClass( 'active' );
      } else {
        adjustWeight( name, -1 );
        $( `.${name}.weight` ).html( `<span class="times">x</span>${getStreamWeight( name )}` );

      }
      update();
    } )


  }

}

function adjustWeight(name: string, amt: number): number {
  for (let i = 0; i < selectedComponents.length; i++) {
    if (selectedComponents[ i ].streamName === name) {
      selectedComponents[ i ].weight += amt;
    }
  }
}

function getStreamWeight(name: string): number {
  for (let i = 0; i < selectedComponents.length; i++) {
    if (selectedComponents[ i ].streamName === name) {
      return selectedComponents[ i ].weight;
    }
  }
}


function getUpdateFxn(data): ()=> void {
  const recalc = genRecalcFxn( data )

  return ()=> {
    let updatedAggStream = recalc();

    $( '.score' ).text( calcLSR( data.official.values, updatedAggStream ) );


    aggStream
        .transition()
        .duration( 500 ).delay( 200 )
        .attr( "d", curve( updatedAggStream ) )
        .style( 'opacity', 1 );
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
    url     : it.url,
    date    : inputDateFormat.parse( it.date )
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