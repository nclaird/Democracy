


$(document).ready(function(){


    var margin = {top: 5, right: 5, bottom: 5, left: 5},
        windowWid = $('.target').width(),
        windowHt = $('.target').height(),
        svgHt = windowHt - margin.top - margin.bottom,
        svgWid = windowWid - margin.left - margin.right,
        target = d3.select('.target'),
        svg = target.append('svg')
                    .attr('height', svgHt)
                    .attr('width', svgWid);








});


