class Scatterplot {
    margin = {
        top: 10, right: 100, bottom: 100, left: 40
    }

    constructor(svg, data, width = 250, height = 250) {
        this.svg = svg;
        this.data = data;
        this.width = width;
        this.height = height;

        this.handlers = {};
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.legend = this.svg.append("g");
        this.triggersGroup = this.svg.append("g").attr("class", "triggers");
        this.boundaryBox = this.svg.append("g").attr("class", "boundary");

        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();
        this.zScale = d3.scaleOrdinal().range(d3.schemeCategory10);

        const containerWidth = this.svg.node().parentElement.getBoundingClientRect().width;
        this.width = containerWidth - this.margin.left - this.margin.right;

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start brush", (event) => {
                this.brushCircles(event);
            });
    }

    update(xVar, yVar, colorVar, useColor, showTrigger = false) {
        this.xVar = xVar;
        this.yVar = yVar;

        const isGaze = xVar.includes("POR") || yVar.includes("POR");

        if (isGaze) {
            this.xScale.domain([0, 1024]).range([0, this.width]);
            this.yScale.domain([0, 768]).range([this.height, 0]);
        } else {
            this.xScale.domain(d3.extent(this.data, d => d[xVar])).range([0, this.width]);
            this.yScale.domain(d3.extent(this.data, d => d[yVar])).range([this.height, 0]);
        }

        this.zScale.domain([...new Set(this.data.map(d => d[colorVar]))]);

        this.circles = this.container.selectAll("circle")
            .data(this.data)
            .join("circle");

        this.circles
            .transition()
            .attr("cx", d => {
                const x = this.xScale(d[xVar]);
                return isGaze ? Math.max(0, Math.min(this.width, x)) : x;
            })
            .attr("cy", d => {
                const y = this.yScale(d[yVar]);
                return isGaze ? Math.max(0, Math.min(this.height, y)) : y;
            })
            .attr("fill", useColor ? d => this.zScale(d[colorVar]) : "black")
            .attr("r", 3);

        this.container.call(this.brush);

        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .transition()
            .call(d3.axisBottom(this.xScale))
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)");

        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .transition()
            .call(d3.axisLeft(this.yScale));

        if (useColor) {
            this.legend
                .style("display", "inline")
                .style("font-size", ".8em")
                .attr("transform", `translate(${this.width + this.margin.left + 10}, ${this.height / 2})`)
                .call(d3.legendColor().scale(this.zScale));
        } else {
            this.legend.style("display", "none");
        }

        this.triggersGroup.selectAll(".trigger-marker").remove();
        if (showTrigger) {
            const triggerPoints = this.data.filter(d => d.Trigger === 1);

            this.triggersGroup
                .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
                .selectAll(".trigger-marker")
                .data(triggerPoints)
                .join("line")
                .attr("class", "trigger-marker")
                .attr("x1", d => this.xScale(d[xVar]))
                .attr("x2", d => this.xScale(d[xVar]))
                .attr("y1", 0)
                .attr("y2", this.height)
                .attr("stroke", "red")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "4,2");
        }
    }

    // isBrushed(d, selection) {
    //     let [[x0, y0], [x1, y1]] = selection;
    //     let x = this.xScale(d[this.xVar]);
    //     let y = this.yScale(d[this.yVar]);

    //     return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    // }

    isBrushed(d, selection) {
    const [[x0, y0], [x1, y1]] = selection;

    const cx = Math.max(0, Math.min(this.width, this.xScale(d[this.xVar])));
    const cy = Math.max(0, Math.min(this.height, this.yScale(d[this.yVar])));

    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}


    brushCircles(event) {
        let selection = event.selection;

        this.circles.classed("brushed", d => this.isBrushed(d, selection));

        if (this.handlers.brush)
            this.handlers.brush(this.data.filter(d => this.isBrushed(d, selection)));
    }

    on(eventType, handler) {
        this.handlers[eventType] = handler;
    }
}
