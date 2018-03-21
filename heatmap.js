/*
 * Heatmap Chart
 */

export default function(config,helper) {

  var Heatmap = Object.create(helper);

  Heatmap.init = function (config){
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._scales ={};
    vm._axes = {};
    
    vm._legendElementWidth = vm._gridWidth;

    vm._tip = d3.tip()
      .attr('class', 'd3-tip')
      .direction('n')
      .html(vm._config.tip || function(d) { 
          console.log(d); 
          return vm.utils.format(d.value);
        }
      );
  }

  //-------------------------------
  //User config functions
  Heatmap.x = function(column){
    var vm = this;
    vm._config.x = column;
    return vm;
  }

  Heatmap.y = function(column){
    var vm = this;
    vm._config.y = column;
    return vm;
  }
  
  Heatmap.fill = function(column){
    var vm = this;
    vm._config.fill = column;
    return vm;
  }

  Heatmap.colors = function(colors){
    var vm = this;
    vm._config.colors = colors;
    return vm;
  }

  /**
   * Personalize border radius (rx, ry) for each rect
   * @param {number} radius - value to be set, default is 5
   */
  Heatmap.borderRadius = function(radius) {
    var vm = this;
    vm._config.borderRadius = radius;
    return vm;
  }

  Heatmap.sortBy = function(sortBy){
    var vm = this;
    vm._config.sortBy = sortBy;
    return vm;
  }

  Heatmap.tip = function(tip){
    var vm = this;
    vm._config.tip = tip;
    vm._tip.html(vm._config.tip);
    return vm;
  }

  //-------------------------------
  //Triggered by the chart.js;
  Heatmap.data = function(data){
    var vm = this;
    var xSort = d3.ascending, 
        ySort = d3.ascending; 
    
    if(typeof vm._config.sortBy === 'string'){
      if(vm._config.hasOwnProperty('sortBy') && vm._config.sortBy === 'desc') xSort = d3.descending; 
    }

    if(typeof vm._config.sortBy === 'object'){
      if(vm._config.hasOwnProperty('sortBy') &&  vm._config.sortBy.hasOwnProperty('x') && vm._config.sortBy.x === 'desc') xSort = d3.descending; 
      if(vm._config.hasOwnProperty('sortBy') &&  vm._config.sortBy.hasOwnProperty('y') && vm._config.sortBy.y === 'desc') ySort = d3.descending; 
    }

    vm._config.xCategories = d3.nest()
      .key(function(d) { return  d[vm._config.x]; }).sortKeys(xSort)
      .entries(data)
      .map(function(d){
        return d.key; 
      });

    vm._config.yCategories = d3.nest()
      .key(function(d) { return  d[vm._config.y]; }).sortKeys(ySort)
      .entries(data)
      .map(function(d){
        return d.key; 
      });

    /**
     * Calculate grid width and height according to chart size
     */
    vm._gridWidth = Math.floor((vm._config.size.width - (vm._config.size.margin.left + vm._config.size.margin.right)) / vm._config.xCategories.length);

    vm._gridHeight = Math.floor((vm._config.size.height - (vm._config.size.margin.top + vm._config.size.margin.bottom)) / vm._config.yCategories.length);

    
    
    vm._data = data.map(function(d){
      var m = {
        y: d[vm._config.y],
        x: d[vm._config.x],
        value: +d[vm._config.fill],
      };
      return m;
    });
    return vm;
  }

  Heatmap.scales = function(){
    var vm = this;
    return vm;
  }

  Heatmap.draw = function(){
    var vm = this;

    //Call the tip
    vm.chart.svg().call(vm._tip)

    vm._yLabels = vm.chart.svg().selectAll(".yLabels")
          .data(vm._config.yCategories)
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * vm._gridHeight; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + vm._gridHeight / 1.5 + ")")
            .attr("class", "yLabels");
            //.attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

    vm._xLabels = vm.chart.svg().selectAll(".xLabels")
        .data(vm._config.xCategories)
        .enter().append("text")
          .text(function(d) { return d; })
          .attr("x", function(d, i) { return i * vm._gridWidth; })
          .attr("y",  vm._config.yCategories.length * vm._gridHeight+25)
          .style("text-anchor", "middle")
          .attr("transform", "translate(" + vm._gridWidth / 2 + ", -6)")
          .attr("class", "xLabels mono axis");
      

    var colorScale = d3.scaleQuantile()
        .domain([0, d3.max(vm._data, function (d) { return d.value; })])
        .range(vm._config.colors);

    var cards = vm.chart.svg().selectAll(".grid-cell")
        .data(vm._data, function(d) {
          return d.y+':'+d.x;
        });

    cards.enter().append("rect")
        .attr("x", function(d) { return (vm._config.xCategories.indexOf(String(d.x)) ) * vm._gridWidth; })
        .attr("y", function(d) { return (vm._config.yCategories.indexOf(String(d.y)) ) * vm._gridHeight; })
        .attr("rx", vm._config.borderRadius || 5)
        .attr("ry", vm._config.borderRadius || 5)

        .attr("class", "grid-cell")
        .style("stroke",'#fff')
        .style("stroke-width",'3px')
        .attr("id", function(d){ return 'x' + d.x + 'y' + d.y;})
        .attr("width", vm._gridWidth)
        .attr("height", vm._gridHeight)
        .on('mouseover', function(d,i){
          vm._tip.show(d, d3.select(this).node());
          if(vm._config.hasOwnProperty('mouseover')){
            vm._config.mouseover.call(vm, d,i);
          }
        })
        .on('mouseout', function(d,i){
          vm._tip.hide(d, d3.select(this).node());
          if(vm._config.hasOwnProperty('mouseout')){
            vm._config.mouseout.call(this, d,i);
          }
        })
        .on("click", function(d,i){
          if(vm._config.hasOwnProperty('onclick')){
            vm._config.onclick.call(this, d, i);
          }
        })
        .style("fill", vm._config.colors[0])
      .transition()
        .duration(3000)
        .ease(d3.easeLinear)
        .style("fill", function(d) { return colorScale(d.value); });
  /*
    var legend = vm.chart.svg().selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

    var lgroup = legend.enter().append("g")
        .attr("class", "legend");

    lgroup.append("rect")
        .attr("x", function(d, i) {  return vm._legendElementWidth * i; })
        .attr("y", vm._config.size.height - vm._config.size.margin.bottom*2)
        .attr("width", vm._legendElementWidth)
        .attr("height", vm._gridWidth / 2)
        .style("fill", function(d, i) { return vm._config.colors[i]; });

    lgroup.append("text")
        .attr("class", "mono")
        .text(function(d) { return "≥ " + Math.round(d); })
        .attr("x", function(d, i) { return vm._legendElementWidth * i; })
        .attr("y", vm._config.size.height - vm._config.size.margin.bottom*2 + vm._gridWidth);

    legend.exit().remove();*/
    return vm;
  }
  Heatmap.init(config);

  return Heatmap;
}
