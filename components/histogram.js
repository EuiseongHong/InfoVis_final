
class Histogram {
    margin = { top: 20, right: 30, bottom: 40, left: 40 };

    constructor(svg, width = 400, height = 400) {
        this.svg = svg;
        this.width = width;
        this.height = height;
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.xAxis = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.height + this.margin.top})`);

        this.yAxis = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.xScale = d3.scaleBand();
        this.yScale = d3.scaleLinear();
    }

    setClickHandler(handler) {
        this.barClickHandler = handler;
    }

    update(data) {
        const categories = data.map(d => d.label);

        this.xScale
            .domain(categories)
            .range([0, this.width])
            .padding(0.3);

        this.yScale
            .domain([0, d3.max(data, d => d.value)])
            .range([this.height, 0]);

        this.container.selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => this.xScale(d.label))
            .attr("y", d => this.yScale(d.value))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.height - this.yScale(d.value))
            .attr("fill", d => d.label === "Outlier" ? "#F44336" : "#4CAF50")
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                if (this.barClickHandler) {
                    this.barClickHandler(d.label);
                }
            });
        // Remove old labels
        this.container.selectAll("text.bar-label").remove();

        // Add new labels
        this.container.selectAll("text.bar-label")
            .data(data)
            .join("text")
            .attr("class", "bar-label")
            .attr("x", d => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr("y", d => this.yScale(d.value) - 5)
            .attr("text-anchor", "middle")
            .attr("fill", "#000")
            .attr("font-size", "12px")
            .text(d => d.value);


        this.xAxis.call(d3.axisBottom(this.xScale));
        this.yAxis.call(d3.axisLeft(this.yScale));
    }
}
