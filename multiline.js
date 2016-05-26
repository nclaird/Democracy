//define margins of svg element
var margin = {top: 20, right: 80, bottom: 30, left: 100},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
//denife how dates are formated and read
var parseDate = d3.time.format("%Y").parse;
//makes the x axis time
var x = d3.time.scale()
    .range([0, width]);
//define y scale will be linear
var y = d3.scale.linear()
    .range([height, 0]);
//define a map of 10 colors for our countries
var color = d3.scale.category10();
//draw x axis and vertical lines at ticks
var xAxis = d3.svg.axis()
    
    .scale(x)
    .orient("bottom")
    .innerTickSize(-height)
    .outerTickSize(0)
    .tickPadding(10);
//draw y axis and horizontal lines at ticks
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .innerTickSize(-width)
    .outerTickSize(0)
    .tickPadding(10);
//how lines are drawn
var line = d3.svg.line()
    
    .interpolate("basis")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.consumption); });

//define margin box
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//data read in
d3.csv("EPC_2000_2010_new.csv", function(error, data) {
  if (error) throw error;

  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

  data.forEach(function(d) {
    d.date = parseDate(d.date);
  });
//country as a name and a mapping of year to value
  var countries = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {date: d.date, consumption: +d[name]};
      })
    };
  });
//defining the x range based on max year
  x.domain(d3.extent(data, function(d) { return d.date; }));
//defining y domain by the max and min values for consumption 
  y.domain([
    d3.min(countries, function(c) { return d3.min(c.values, function(v) { return v.consumption; }); }),
    d3.max(countries, function(c) { return d3.max(c.values, function(v) { return v.consumption; }); })
  ]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
    .style("text-anchor", "middle")
    .attr("x",(width/2))
    .attr("y",30)      
    .text("Year");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("consumption (BTU per capita)");
//country holder of data
  var country = svg.selectAll(".country")
      .data(countries)
    .enter().append("g")
      .attr("class", "country");


    //define how path is drawn
var path = country.append("path")  
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });
    
   

    //used for animation
var totalLength = path.node().getTotalLength();
//animating path
path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
        .duration(20000)
        .ease("bounce")
        .attr("stroke-dashoffset", 0);
//draw names at end of line
  country.append("text")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.consumption) + ")"; })
      .attr("x", 3)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });
});
