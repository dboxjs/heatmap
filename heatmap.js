import * as d3 from 'd3';

/*
 * Heatmap Chart
 */
export default function(config, helper) {
  var Heatmap = Object.create(helper);

  Heatmap.init = function(config) {
    var vm = this;
    vm._config = config ? config : {};
    if (!vm._config.size.legendTranslate) {
      vm._config.size.legendTranslate = 100;
    }
    vm._data = [];
    vm._scales = {};
    vm._axes = {};

    vm._legendElementWidth = vm._gridWidth;

    vm._tip = vm.utils.d3
      .tip()
      .attr(
        'class',
        'd3-tip ' +
          (vm._config.tooltip && vm._config.tooltip.classed
            ? vm._config.tooltip.classed
            : '')
      )
      .direction('n')
      .html(
        vm._config.tip ||
          function(d) {
            var html = d.x;
            if (d.x !== d.y) {
              html += '<br>' + d.y;
            }
            html += '<br>' + vm.utils.format()(d.value);
            return html;
          }
      );
  };

  //-------------------------------
  //User config functions
  Heatmap.x = function(column) {
    var vm = this;
    vm._config.x = column;
    return vm;
  };

  Heatmap.y = function(column) {
    var vm = this;
    vm._config.y = column;
    return vm;
  };

  Heatmap.fill = function(column) {
    var vm = this;
    vm._config.fill = column;
    return vm;
  };

  Heatmap.colors = function(colors) {
    var vm = this;
    vm._config.colors = colors;
    return vm;
  };

  Heatmap.colorLegend = function(legendTitle) {
    var vm = this;
    vm._config.legendTitle = legendTitle;
    return vm;
  };

  /**
   * Personalize border radius (rx, ry) for each rect
   * @param {number} radius - value to be set, default is 5
   */
  Heatmap.borderRadius = function(radius) {
    var vm = this;
    vm._config.borderRadius = radius;
    return vm;
  };

  Heatmap.sortBy = function(sortBy) {
    var vm = this;
    vm._config.sortBy = sortBy;
    return vm;
  };

  Heatmap.tip = function(tip) {
    var vm = this;
    vm._config.tip = tip;
    vm._tip.html(vm._config.tip);
    return vm;
  };

  //-------------------------------
  //Triggered by chart.js;
  Heatmap.data = function(data) {
    var vm = this;
    var xSort = vm.utils.sortAscending;
    var ySort = vm.utils.sortAscending;

    if (typeof vm._config.sortBy === 'string') {
      if (vm._config.hasOwnProperty('sortBy') && vm._config.sortBy === 'desc')
        xSort = vm.utils.sortDescending;
    }

    if (typeof vm._config.sortBy === 'object') {
      if (
        vm._config.hasOwnProperty('sortBy') &&
        vm._config.sortBy.hasOwnProperty('x') &&
        vm._config.sortBy.x === 'desc'
      )
        xSort = vm.utils.sortDescending;
      if (
        vm._config.hasOwnProperty('sortBy') &&
        vm._config.sortBy.hasOwnProperty('y') &&
        vm._config.sortBy.y === 'desc'
      )
        ySort = vm.utils.sortDescending;
    }

    vm._config.xCategories = d3
      .nest()
      .key(function(d) {
        return d[vm._config.x];
      })
      .sortKeys(xSort)
      .entries(data)
      .map(function(d) {
        return d.key;
      });

    vm._config.yCategories = d3
      .nest()
      .key(function(d) {
        return d[vm._config.y];
      })
      .sortKeys(ySort)
      .entries(data)
      .map(function(d) {
        return d.key;
      });

    vm._config.fillValues = d3
      .nest()
      .key(function(d) {
        return d[vm._config.fill];
      })
      .entries(data)
      .map(function(d) {
        return Number(d.key);
      });

    /**
     * Calculate grid width and height according to chart size
     */
    vm._gridWidth = Math.floor(
      (vm._config.size.width -
        (vm._config.size.margin.left + vm._config.size.margin.right)) /
        vm._config.xCategories.length
    );

    vm._gridHeight = Math.floor(
      (vm._config.size.height -
        (vm._config.size.margin.top + vm._config.size.margin.bottom)) /
        vm._config.yCategories.length
    );

    vm._data = data.map(function(d) {
      var m = {
        y: d[vm._config.y],
        x: d[vm._config.x],
        value: +d[vm._config.fill]
      };
      if (d.coefficient) {
        m.coefficient = d.coefficient.toFixed(2);
      }
      return m;
    });

    return vm;
  };

  Heatmap.scales = function() {
    var vm = this;
    return vm;
  };

  Heatmap.drawColorLegend = function() {
    var vm = this;

    var domain = vm._config.colors;
    var quantilePosition = d3
      .scaleBand()
      .rangeRound([vm._config.size.height * 0.8, 0])
      .domain(domain);
    //Add gradient legend
    //defaults to right position
    var legend = d3
      .select(vm._config.bindTo)
      .select('svg')
      .append('g')
      .attr('class', 'legend quantized')
      .attr(
        'transform',
        'translate(' +
          (vm._config.size.width - vm._config.size.legendTranslate) +
          ',' +
          vm._config.size.height * 0.1 +
          ')'
      );

    // legend background
    legend
      .append('rect')
      .attr('x', -50)
      .attr('y', -35)
      .attr('width', 100)
      .attr('height', vm._config.size.height - 10)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('class', 'legend-background')
      .attr('fill', 'rgba(255,255,255,0.6)');

    // legend title
    legend
      .append('text')
      .attr('x', 0)
      .attr('y', -12)
      .attr('class', 'legend-title')
      .attr('text-anchor', 'middle')
      .text(vm._config.legendTitle);

    var quantiles = legend
      .selectAll('.quantile')
      .data(vm._config.colors)
      .enter()
      .append('g')
      .attr('class', 'quantile')
      .attr('transform', function(d) {
        return 'translate(-20, ' + quantilePosition(d) + ')';
      });

    // Rect
    quantiles
      .append('rect')
      .attr('x', -15)
      .attr('y', 0)
      .attr('width', 18)
      .attr('height', quantilePosition.bandwidth())
      .attr('fill', function(d) {
        return d;
      });

    //top text is the max value
    quantiles
      .append('text')
      .attr('x', 17)
      .attr('y', 5)
      .attr('class', 'top-label')
      .attr('text-anchor', 'left')
      .text(function(d) {
        let max = vm._scales.color.invertExtent(d)[1];
        if (vm._config.legendTitle === 'Porcentaje' && max > 100) {
          max = 100;
        }
        return vm.utils.format()(max);
      });

    //top text is the min value
    quantiles
      .append('text')
      .attr('x', 17)
      .attr('y', vm._config.size.height / 5 - 18)
      .attr('class', 'bottom-label')
      .attr('text-anchor', 'left')
      .text(function(d, i) {
        if (i === 0) {
          let min = vm._scales.color.invertExtent(d)[0];
          return vm.utils.format()(min);
        } else {
          return '';
        }
      });
  };

  Heatmap.drawLabels = function() {
    var vm = this;
    var cards = vm.chart
      .svg()
      .selectAll('.dbox-label')
      .data(vm._data, function(d) {
        return d.y + ':' + d.x;
      });
    // AXIS
    /*cards.enter().append('text')
      .attr('transform', 'translate(' + (-vm._gridWidth/2) + ', 10)')
      .attr('dx', function(d){ 
        return (((vm._config.xCategories.indexOf(String(d.x))) + 1) * vm._gridWidth);
      })
      .attr('dy', function(d) {
        return (vm._config.yCategories.indexOf(String(d.y))) * vm._gridHeight;
      })
      .attr('class', 'dbox-label')
      .text( function(d) { return d.x });

    cards.enter().append('text')
      .attr('transform', 'translate(' + (-vm._gridWidth/2) + ', 30)')
      .attr('dx', function(d){
        return (((vm._config.xCategories.indexOf(String(d.x))) + 1) * vm._gridWidth)
      })
      .attr('dy', function(d) {
        return (vm._config.yCategories.indexOf(String(d.y))) * vm._gridHeight;
      })
      .attr('class', 'dbox-label')
      .text( function(d) { return d.y });*/

    cards
      .enter()
      .append('text')
      .attr('transform', 'translate(' + -vm._gridWidth / 2 + ', 20)')
      .attr('dx', function(d) {
        return (
          (vm._config.xCategories.indexOf(String(d.x)) + 1) * vm._gridWidth
        );
      })
      .attr('dy', function(d) {
        return vm._config.yCategories.indexOf(String(d.y)) * vm._gridHeight;
      })
      .attr('class', 'dbox-label')
      .text(function(d) {
        return d.value ? vm.utils.format()(d.value) : '';
      });

    //COEFFICIENT
    cards
      .enter()
      .append('text')
      .attr('transform', 'translate(' + -vm._gridWidth / 2 + ', 40)')
      .attr('dx', function(d) {
        return (
          (vm._config.xCategories.indexOf(String(d.x)) + 1) * vm._gridWidth
        );
      })
      .attr('dy', function(d) {
        return vm._config.yCategories.indexOf(String(d.y)) * vm._gridHeight;
      })
      .attr('class', 'dbox-label-coefficient')
      .text(function(d) {
        return d.coefficient
          ? '(' + parseFloat(d.coefficient).toFixed(1) + ')'
          : '';
      });
  };

  Heatmap.draw = function() {
    var vm = this;

    //Call the tip
    vm.chart.svg().call(vm._tip);

    const axesTip = vm.utils.d3.tip().html(d => {
      return '<div class="title-tip">' + d + '</div>';
    });
    vm.chart.svg().call(axesTip);

    vm._yLabels = vm.chart
      .svg()
      .append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(0,0)')
      .selectAll('.tick')
      .data(vm._config.yCategories)
      .enter()
      .append('g')
      .attr('class', 'tick')
      .attr('transform', function(d, i) {
        return 'translate(0,' + i * vm._gridHeight + ')';
      })
      .append('text')
      .attr('text-anchor', 'end')
      .attr('transform', 'translate(-6,' + vm._gridHeight / 1.5 + ')')
      .text(function(d) {
        return d;
      });

    vm._yLabels.each(function(d) {
      if (this.getComputedTextLength() > vm._config.size.margin.left * 0.9) {
        d3.select(this)
          .on('mouseover', axesTip.show)
          .on('mouseout', axesTip.hide);
        let i = 1;
        while (
          this.getComputedTextLength() >
          vm._config.size.margin.left * 0.9
        ) {
          d3.select(this)
            .text(function(d) {
              return d.slice(0, -i) + '...';
            })
            .attr('title', d);
          ++i;
        }
      }
    });

    /** Y axis title */
    vm._yTitle = vm.chart
      .svg()
      .select('.y.axis')
      .select('.y-title')
      .data(vm._config.yAxis.text)
      .enter()
      .append('g')
      .attr('class', 'y-title')
      .attr('transform', function(d, i) {
        return 'translate(0,' + i * vm._gridHeight + ')';
      })
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(-6,' + vm._gridHeight / 1.5 + ')')
      .text(function(d) {
        return d;
      });

    vm._xLabels = vm.chart
      .svg()
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,0)')
      .selectAll('.tick')
      .data(vm._config.xCategories)
      .enter()
      .append('g')
      .attr('class', 'tick')
      .attr('transform', function(d, i) {
        return (
          'translate(' +
          (i * vm._gridWidth + vm._gridWidth / 2) +
          ',' +
          (vm._config.yCategories.length * vm._gridHeight + 20) +
          ')'
        );
      })
      .append('text')
      .attr('text-anchor', 'middle')
      .text(function(d) {
        return d;
      });

    const biggestLabelWidth = d3.max(
      d3
        .select('.x.axis')
        .selectAll('text')
        .nodes()
        .map(o => o.getComputedTextLength())
    ); // Biggest label computed text length
    let xBandWidth = vm._gridWidth;
    let labelMaxWidth = xBandWidth;
    if (biggestLabelWidth > xBandWidth) {
      // Biggest label doesn't fit
      vm._xLabels.each(function(d) {
        d3.select(this)
          .attr('text-anchor', 'end')
          .attr('dy', 0)
          .attr('transform', 'translate(-5,-10)rotate(-90)');
        // Still doesn't fit!
        labelMaxWidth = 0.75 * vm._config.size.margin.bottom;
        if (this.getComputedTextLength() > labelMaxWidth) {
          d3.select(this)
            .on('mouseover', axesTip.show)
            .on('mouseout', axesTip.hide);
          let i = 1;
          while (this.getComputedTextLength() > labelMaxWidth) {
            d3.select(this)
              .text(function(d) {
                return d.slice(0, -i) + '...';
              })
              .attr('title', d);
            ++i;
          }
        } else {
          return d;
        }
      });
    }
    vm._scales.color = d3
      .scaleQuantile()
      .domain(
        d3.extent(vm._data, d => {
          return d.value;
        })
      )
      .range(vm._config.colors);

    var cards = vm.chart
      .svg()
      .selectAll('.grid-cell')
      .data(vm._data, function(d) {
        return d.y + ':' + d.x;
      });

    cards
      .enter()
      .append('rect')
      .attr('x', function(d) {
        return vm._config.xCategories.indexOf(String(d.x)) * vm._gridWidth;
      })
      .attr('y', function(d) {
        return vm._config.yCategories.indexOf(String(d.y)) * vm._gridHeight;
      })
      .attr('rx', vm._config.borderRadius || 5)
      .attr('ry', vm._config.borderRadius || 5)

      .attr('class', 'grid-cell')
      .attr('stroke', '#fff')
      .attr('stroke-width', '3px')
      .attr('id', function(d) {
        return 'x' + d.x + 'y' + d.y;
      })
      .attr('width', vm._gridWidth)
      .attr('height', vm._gridHeight)
      .on('mouseover', function(d, i) {
        vm._tip.show(d, d3.select(this).node());
        if (vm._config.hasOwnProperty('mouseover')) {
          vm._config.mouseover.call(vm, d, i);
        }
      })
      .on('mouseout', function(d, i) {
        vm._tip.hide(d, d3.select(this).node());
        if (vm._config.hasOwnProperty('mouseout')) {
          vm._config.mouseout.call(this, d, i);
        }
      })
      .on('click', function(d, i) {
        if (vm._config.hasOwnProperty('onclick')) {
          vm._config.onclick.call(this, d, i);
        }
      })
      .attr('fill', vm._config.colors[0])
      .transition()
      .duration(3000)
      .ease(d3.easeLinear)
      .attr('fill', function(d) {
        return vm._scales.color(d.value);
      });

    Heatmap.drawLabels();

    if (vm._config.hasOwnProperty('legendTitle')) {
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
