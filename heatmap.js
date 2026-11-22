import * as d3 from 'd3';

/** Gap between the row labels and the first column, in px. */
var PLOT_OFFSET = 17;
/** Space kept to the right of the plot for the colour legend, in px. */
var LEGEND_WIDTH = 76;

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
   * @param {number} radius - value to be set, default is 0 (square cells)
   */
  Heatmap.borderRadius = function(radius) {
    var vm = this;
    vm._config.borderRadius = radius;
    return vm;
  };

  /**
   * Space between cells, in px, painted in the surface colour. Default 0, so
   * the cells read as one surface and narrow cells (one year each, say) stay
   * visible.
   * @param {number} px
   */
  Heatmap.cellGap = function(px) {
    var vm = this;
    vm._config.cellGap = px;
    return vm;
  };

  /**
   * How values map to the colours given with colors():
   * - 'sequential' (default): continuous, from the lowest value to the highest;
   * - 'diverging': continuous, centred on options.midpoint (default 0), the
   *   two arms equal unless options.symmetric is false;
   * - 'quantile': one colour per equal-count class, so colour means rank.
   * @param {string} type
   * @param {Object} [options]
   */
  Heatmap.colorScale = function(type, options) {
    var vm = this;
    vm._config.colorScale = type;
    vm._config.colorScaleOptions = options || {};
    return vm;
  };

  /**
   * Print each cell's value inside it (off by default).
   * @param {boolean} on
   */
  Heatmap.labels = function(on) {
    var vm = this;
    vm._config.cellLabels = !!on;
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
    // Fractional sizes: flooring to whole pixels is what made one-pixel
    // cells vanish. The legend gets its own space, beside the plot.
    var legendSpace = vm._config.hasOwnProperty('legendTitle')
      ? LEGEND_WIDTH
      : 0;
    vm._gridWidth = Math.max(
      0,
      (vm._config.size.width -
        (vm._config.size.margin.left + vm._config.size.margin.right) -
        PLOT_OFFSET -
        legendSpace) /
        vm._config.xCategories.length
    );

    vm._gridHeight =
      (vm._config.size.height -
        (vm._config.size.margin.top + vm._config.size.margin.bottom)) /
      vm._config.yCategories.length;

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

  Heatmap.buildColorScale = function() {
    var vm = this;
    var colors =
      vm._config.colors && vm._config.colors.length
        ? vm._config.colors
        : ['#cde2fb', '#104281'];
    var values = vm._data
      .map(function(d) {
        return d.value;
      })
      .filter(function(v) {
        return !Number.isNaN(v);
      });
    var type = vm._config.colorScale || 'sequential';
    var opts = vm._config.colorScaleOptions || {};

    if (type === 'quantile' || colors.length < 2) {
      return d3
        .scaleQuantile()
        .domain(values)
        .range(colors);
    }

    var ext = d3.extent(values);
    var domain;
    if (type === 'diverging') {
      var mid = opts.midpoint !== undefined ? +opts.midpoint : 0;
      var lo = ext[0];
      var hi = ext[1];
      if (opts.symmetric !== false) {
        var r = Math.max(Math.abs(lo - mid), Math.abs(hi - mid));
        lo = mid - r;
        hi = mid + r;
      }
      var m = (colors.length - 1) / 2;
      domain = colors.map(function(c, i) {
        return i <= m
          ? lo + (mid - lo) * (i / m)
          : mid + (hi - mid) * ((i - m) / (colors.length - 1 - m));
      });
      vm._colorDomain = [lo, mid, hi];
    } else {
      domain = colors.map(function(c, i) {
        return ext[0] + (ext[1] - ext[0]) * (i / (colors.length - 1));
      });
      vm._colorDomain = [ext[0], ext[1]];
    }
    return d3
      .scaleLinear()
      .domain(domain)
      .range(colors)
      .interpolate(d3.interpolateLab)
      .clamp(true);
  };

  /**
   * The colour legend, in the space kept for it to the right of the plot: a
   * thin vertical bar (continuous scales) or one block per class (quantile),
   * with its values beside it and its title above.
   */
  Heatmap.drawColorLegend = function() {
    var vm = this;
    var scale = vm._scales.color;
    var fmt = vm.utils.format();
    var plotRight =
      PLOT_OFFSET + vm._config.xCategories.length * vm._gridWidth;
    var plotH = vm._config.yCategories.length * vm._gridHeight;
    var barW = 10;

    var legend = vm.chart
      .svg()
      .append('g')
      .attr('class', 'legend dbox-color-legend')
      .attr('transform', 'translate(' + (plotRight + 14) + ',0)');

    // The title above the bar, on up to two lines.
    var top = 0;
    if (vm._config.legendTitle) {
      var title = legend
        .append('text')
        .attr('class', 'legend-title')
        .attr('x', 0)
        .attr('y', 10)
        .attr('font-size', 12)
        .style('fill', 'var(--dbox-text-secondary, color-mix(in srgb, currentColor 72%, transparent))')
        .text(vm._config.legendTitle);
      vm.utils.wrap(title, LEGEND_WIDTH - 8);
      top = 8 + Math.max(1, title.selectAll('tspan').size()) * 14;
    }
    var barH = Math.max(48, plotH - top);

    var labels = [];
    if (scale.quantiles) {
      var classes = scale.range();
      var h = barH / classes.length;
      classes.forEach(function(c, i) {
        // Highest class on top.
        var y0 = top + (classes.length - 1 - i) * h;
        legend
          .append('rect')
          .attr('x', 0)
          .attr('y', y0)
          .attr('width', barW)
          .attr('height', h + 0.5)
          .attr('fill', c);
        var ext = scale.invertExtent(c);
        if (i === 0) labels.push({ y: y0 + h, v: ext[0] });
        labels.push({ y: y0, v: ext[1] });
      });
    } else {
      var steps = 48;
      var dom = vm._colorDomain;
      var lo = dom[0];
      var hi = dom[dom.length - 1];
      var y = d3
        .scaleLinear()
        .domain([lo, hi])
        .range([top + barH, top]);
      d3.range(steps).forEach(function(i) {
        var v0 = lo + ((hi - lo) * i) / steps;
        var v1 = lo + ((hi - lo) * (i + 1)) / steps;
        legend
          .append('rect')
          .attr('x', 0)
          .attr('y', y(v1))
          .attr('width', barW)
          .attr('height', Math.abs(y(v0) - y(v1)) + 0.5)
          .attr('fill', scale((v0 + v1) / 2));
      });
      dom.forEach(function(v) {
        labels.push({ y: y(v), v: v });
      });
    }

    labels.forEach(function(l) {
      legend
        .append('text')
        .attr('class', 'legend-label')
        .attr('x', barW + 6)
        .attr('y', l.y)
        .attr('dy', '0.35em')
        .attr('font-size', 12)
        .style('fill', 'var(--dbox-text-muted, color-mix(in srgb, currentColor 64%, transparent))')
        .style('font-variant-numeric', 'tabular-nums')
        .text(fmt(l.v));
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
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + (-vm._gridWidth / 2 + 17) + ', 20)')
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
      .attr('transform', 'translate(' + PLOT_OFFSET + ',0)')
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
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 12)
      .style('fill', 'var(--dbox-text-muted, color-mix(in srgb, currentColor 64%, transparent))')
      .attr('transform', 'translate(-6,' + vm._gridHeight / 2 + ')')
      .text(function(d) {
        return d;
      });

    // Short rows: label every n-th one. Long names: drop whole words.
    var everyRow = Math.max(1, Math.ceil(13 / Math.max(vm._gridHeight, 1)));
    vm._yLabels.each(function(d, i) {
      if (i % everyRow !== 0) {
        d3.select(this).style('display', 'none');
        return;
      }
      if (vm.utils.fitWords(this, vm._config.size.margin.left * 0.9)) {
        d3.select(this)
          .on('mouseover', axesTip.show)
          .on('mouseout', axesTip.hide);
      }
    });

    /** Y axis title */
    if (vm._config.yAxis && vm._config.yAxis.text) {
      const yAxis = vm.chart.svg().select('.y.axis');
      yAxis.selectAll('.y-title').remove();
      vm._yTitle = yAxis
        .append('g')
        .attr('class', 'y-title')
        .attr('transform', function(d, i) {
          return 'translate(0,' + i * vm._gridHeight + ')';
        })
        .append('text')
        .attr('class', 'axis-title')
        .attr('font-size', 13)
        .attr('font-weight', 400)
        .style('fill', 'var(--dbox-text-secondary, color-mix(in srgb, currentColor 72%, transparent))')
        .attr('text-anchor', 'middle')
        .attr(
          'transform',
          `translate(-${vm._config.size.margin.left - 3}, ${(vm._config.size
            .height -
            vm._config.size.margin.bottom) /
            2} )rotate(-90)`
        )
        .text(vm._config.yAxis.text);
    }

    vm._xLabels = vm.chart
      .svg()
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + PLOT_OFFSET + ',0)')
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
      .attr('font-size', 12)
      .style('fill', 'var(--dbox-text-muted, color-mix(in srgb, currentColor 64%, transparent))')
      .text(function(d) {
        return d;
      });

    // Labels wider than their column: show every n-th one. Measured on this
    // chart's own labels (a page-wide '.x.axis' selector measured another).
    const biggestLabelWidth =
      d3.max(
        vm._xLabels.nodes().map(function(o) {
          return o.getComputedTextLength();
        })
      ) || 0;
    var everyCol = Math.max(
      1,
      Math.ceil((biggestLabelWidth + 6) / Math.max(vm._gridWidth, 1))
    );
    vm._xLabels.style('display', function(d, i) {
      return i % everyCol === 0 ? null : 'none';
    });

    if (vm._config.xAxis && vm._config.xAxis.text) {
      const xAxis = vm.chart.svg().select('.x.axis');
      xAxis.selectAll('.x-title').remove();
      vm._xTitle = xAxis
        .append('g')
        .attr('class', 'x-title')
        .attr('transform', function(d, i) {
          return 'translate(0,' + i * vm._gridHeight + ')';
        })
        .append('text')
        .attr('class', 'axis-title')
        .attr('font-size', 13)
        .attr('font-weight', 400)
        .style('fill', 'var(--dbox-text-secondary, color-mix(in srgb, currentColor 72%, transparent))')
        .attr('text-anchor', 'middle')
        .attr(
          'transform',
          `translate(${(vm._config.size.width -
            vm._config.size.margin.left -
            vm._config.size.margin.right) /
            2}, ${vm._config.size.height - 20})`
        )
        .text(vm._config.xAxis.text);
    }

    vm._scales.color = Heatmap.buildColorScale();

    var gap = +vm._config.cellGap || 0;
    var cards = vm.chart
      .svg()
      .append('g')
      .attr('class', 'grid-container')
      .attr('transform', 'translate(' + PLOT_OFFSET + ', 0)')
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
      .attr('rx', vm._config.borderRadius || 0)
      .attr('ry', vm._config.borderRadius || 0)

      .attr('class', 'grid-cell')
      .style('stroke', gap ? 'var(--dbox-surface, Canvas)' : 'none')
      .attr('stroke-width', gap || null)
      .attr('shape-rendering', gap ? null : 'crispEdges')
      .attr('id', function(d) {
        return 'x' + d.x + 'y' + d.y;
      })
      // Without a gap, a hair of overlap hides antialiasing seams.
      .attr('width', vm._gridWidth + (gap ? 0 : 0.5))
      .attr('height', vm._gridHeight + (gap ? 0 : 0.5))
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
      .attr('fill', function(d) {
        return vm._scales.color(d.value);
      });

    // Values in the cells only when asked for: the colour and the tooltip
    // carry them, and a number in every cell is unreadable.
    if (vm._config.cellLabels) {
      Heatmap.drawLabels();
    }

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
