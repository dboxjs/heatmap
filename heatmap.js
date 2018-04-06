/*
 * Heatmap Chart
 */

export default function (config, helper) {

  var Heatmap = Object.create(helper);

  Heatmap.init = function (config) {
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._scales = {};
    vm._axes = {};

    vm._legendElementWidth = vm._gridWidth;

    vm._tip = d3.tip()
      .attr('class', 'd3-tip')
      .direction('n')
      .html(vm._config.tip || function (d) {
        return vm.utils.format(d.value);
      });
  };

  //-------------------------------
  //User config functions
  Heatmap.x = function (column) {
    var vm = this;
    vm._config.x = column;
    return vm;
  };

  Heatmap.y = function (column) {
    var vm = this;
    vm._config.y = column;
    return vm;
  };

  Heatmap.fill = function (column) {
    var vm = this;
    vm._config.fill = column;
    return vm;
  };

  Heatmap.colors = function (colors) {
    var vm = this;
    vm._config.colors = colors;
    return vm;
  };

  Heatmap.colorLegend = function (legendTitle) {
    var vm = this;
    vm._config.legendTitle = legendTitle;
    return vm;
  };

  /**
   * Personalize border radius (rx, ry) for each rect
   * @param {number} radius - value to be set, default is 5
   */
  Heatmap.borderRadius = function (radius) {
    var vm = this;
    vm._config.borderRadius = radius;
    return vm;
  };

  Heatmap.sortBy = function (sortBy) {
    var vm = this;
    vm._config.sortBy = sortBy;
    return vm;
  };

  Heatmap.tip = function (tip) {
    var vm = this;
    vm._config.tip = tip;
    vm._tip.html(vm._config.tip);
    return vm;
  };

  //-------------------------------
  //Triggered by chart.js;
  Heatmap.data = function (data) {
    var vm = this;
    var xSort = function (a, b) {
      if (!Number.isNaN(+a) && !Number.isNaN(+b)) {
        return Number(a) - Number(b);
      } else if (a <= b) {
        return -1;
      } else {
        return 1;
      }
    };
    var ySort = d3.ascending;

    if (typeof vm._config.sortBy === 'string') {
      if (vm._config.hasOwnProperty('sortBy') && vm._config.sortBy === 'desc') xSort = d3.descending;
    }

    if (typeof vm._config.sortBy === 'object') {
      if (vm._config.hasOwnProperty('sortBy') && vm._config.sortBy.hasOwnProperty('x') && vm._config.sortBy.x === 'desc') xSort = d3.descending;
      if (vm._config.hasOwnProperty('sortBy') && vm._config.sortBy.hasOwnProperty('y') && vm._config.sortBy.y === 'desc') ySort = d3.descending;
    }

    vm._config.xCategories = d3.nest()
      .key(function (d) {
        return d[vm._config.x];
      }).sortKeys(xSort)
      .entries(data)
      .map(function (d) {
        return d.key;
      });

    vm._config.yCategories = d3.nest()
      .key(function (d) {
        return d[vm._config.y];
      }).sortKeys(ySort)
      .entries(data)
      .map(function (d) {
        return d.key;
      });

    vm._config.fillValues = d3.nest()
      .key(function (d) {
        return d[vm._config.fill];
      })
      .entries(data)
      .map(function (d) {
        return Number(d.key);
      });

    /**
     * Calculate grid width and height according to chart size
     */
    vm._gridWidth = Math.floor((vm._config.size.width - (vm._config.size.margin.left + vm._config.size.margin.right)) / vm._config.xCategories.length);

    vm._gridHeight = Math.floor((vm._config.size.height - (vm._config.size.margin.top + vm._config.size.margin.bottom)) / vm._config.yCategories.length);

    vm._data = data.map(function (d) {
      var m = {
        y: d[vm._config.y],
        x: d[vm._config.x],
        value: +d[vm._config.fill],
      };
      return m;
    });

    return vm;
  };

  Heatmap.scales = function () {
    var vm = this;
    return vm;
  };

  Heatmap.drawColorLegend = function () {
    var vm = this;
   
    //Define legend gradient
    var defs = vm.chart.svg().append('defs');

    var linearGradient = defs.append('linearGradient')
      .attr('id', 'linear-gradient-label');

    //Define direction for gradient. Default is vertical top-bottom.
    linearGradient
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    //Define color scheme as linear gradient
    var colorScale = d3.scaleLinear()
      .range(vm._config.colors);

    linearGradient.selectAll('stop') 
      .data(colorScale.range())                  
      .enter().append('stop')
      .attr('offset', function(d,i) { return i/(colorScale.range().length-1); })
      .attr('stop-color', function(d) { return d; });

    //Add gradient legend 
    //defaults to right position
    var legend = vm.chart.svg()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(' + (vm._config.size.width - vm._config.size.margin.right + 5) +',' + vm._config.size.height * .1 + ')');

    //legend title
    legend.append('text')
      .attr('x', 0)
      .attr('class', 'legend-title')
      .attr('text-anchor', 'start')
      .text(vm._config.legendTitle);

    //top text is the max value
    legend.append('text')
      .attr('x', 0)
      .attr('y', '1.5em')
      .attr('class', 'top-label')
      .attr('text-anchor', 'start')
      .text(function(){
        let max = Math.ceil(Math.max(...vm._config.fillValues));
        return max.toLocaleString();
      })

    //draw gradient
    legend.append('rect')
      .attr('x', 0)
      .attr('y', '2.3em')
      .attr('width', 18)
      .attr('height', vm._config.size.height * 0.6)
      .attr('fill', 'url(#linear-gradient-label)');

    //bottom text is the min value
    legend.append('text')
      .attr('x', 0)
      .attr('y', vm._config.size.height * 0.6 + 40)
      .attr('class', 'bottom-label')
      .attr('text-anchor', 'start')
      .text(function(){ 
        let min = Math.floor(Math.min(...vm._config.fillValues))
        return min.toLocaleString();
      });

  };

  Heatmap.draw = function () {
    var vm = this;

    //Call the tip
    vm.chart.svg().call(vm._tip);

    vm._yLabels = vm.chart.svg().append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(0,0)')
      .selectAll('.tick')
      .data(vm._config.yCategories)
      .enter()
      .append('g')
      .attr('class', 'tick')
      .attr('transform', function(d, i) {
        return 'translate(0,' + (i * vm._gridHeight) + ')';
      })
      .append('text')
      .attr('text-anchor', 'end')
      .attr('transform', 'translate(-6,' + vm._gridHeight / 1.5 + ')')
      .text(function (d) {
        return d;
      });

    vm._xLabels = vm.chart.svg().append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,0)')
      .selectAll('.tick')
      .data(vm._config.xCategories)
      .enter()
      .append('g')
      .attr('class', 'tick')
      .attr('transform', function (d, i) {
        return 'translate(' + (i * vm._gridWidth + (vm._gridWidth / 2) - 12) + ',' + (vm._config.yCategories.length * vm._gridHeight + 20 ) + ')';
      })
      .append('text')
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return d;
      });

    var colorScale = d3.scaleQuantile()
      .domain([0, d3.max(vm._data, function (d) {
        return d.value;
      })])
      .range(vm._config.colors);

    var cards = vm.chart.svg().selectAll('.grid-cell')
      .data(vm._data, function (d) {
        return d.y + ':' + d.x;
      });

    cards.enter().append('rect')
      .attr('x', function (d) {
        return (vm._config.xCategories.indexOf(String(d.x))) * vm._gridWidth;
      })
      .attr('y', function (d) {
        return (vm._config.yCategories.indexOf(String(d.y))) * vm._gridHeight;
      })
      .attr('rx', vm._config.borderRadius || 5)
      .attr('ry', vm._config.borderRadius || 5)

      .attr('class', 'grid-cell')
      .attr('stroke', '#fff')
      .attr('stroke-width', '3px')
      .attr('id', function (d) {
        return 'x' + d.x + 'y' + d.y;
      })
      .attr('width', vm._gridWidth)
      .attr('height', vm._gridHeight)
      .on('mouseover', function (d, i) {
        vm._tip.show(d, d3.select(this).node());
        if (vm._config.hasOwnProperty('mouseover')) {
          vm._config.mouseover.call(vm, d, i);
        }
      })
      .on('mouseout', function (d, i) {
        vm._tip.hide(d, d3.select(this).node());
        if (vm._config.hasOwnProperty('mouseout')) {
          vm._config.mouseout.call(this, d, i);
        }
      })
      .on('click', function (d, i) {
        if (vm._config.hasOwnProperty('onclick')) {
          vm._config.onclick.call(this, d, i);
        }
      })
      .attr('fill', vm._config.colors[0])
      .transition()
      .duration(3000)
      .ease(d3.easeLinear)
      .attr('fill', function (d) {
        return colorScale(d.value);
      });

    if (vm._config.hasOwnProperty('legendTitle') ){ 
      Heatmap.drawColorLegend(); 
    }
      
    /*
      var legend = vm.chart.svg().selectAll('.legend')
          .data([0].concat(colorScale.quantiles()), function(d) { return d; });

      var lgroup = legend.enter().append('g')
          .attr('class', 'legend');

      lgroup.append('rect')
          .attr('x', function(d, i) {  return vm._legendElementWidth * i; })
          .attr('y', vm._config.size.height - vm._config.size.margin.bottom*2)
          .attr('width', vm._legendElementWidth)
          .attr('height', vm._gridWidth / 2)
          .style('fill', function(d, i) { return vm._config.colors[i]; });

      lgroup.append('text')
          .attr('class', 'mono')
          .text(function(d) { return '≥ ' + Math.round(d); })
          .attr('x', function(d, i) { return vm._legendElementWidth * i; })
          .attr('y', vm._config.size.height - vm._config.size.margin.bottom*2 + vm._gridWidth);

      legend.exit().remove();*/
    return vm;
  };

  Heatmap.init(config);

  return Heatmap;
}
