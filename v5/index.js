console.log('Hello Electrorating');

window.addEventListener('resize', update);

let formatedData,
	rawData,
	dataByYear,
	chartData,
	hierachy,
	hierarchyArrs = {
		root: [],
		parents: [],
		companies: [],
	},
	// groupBy,
	colors,
	selectedProp = 'year',
	selectedYear = 2020,
	indicator = 'ACTIVOS',
	interval,
	svg,
	stratify,
	treemap;

let margins = { top: 100, left: window.innerWidth / 20 };
let width = window.innerWidth - margins.left * 2;
let height = window.innerHeight - margins.top * 2;

const [playBtn, pauseBtn, resetBtn, yearDisplay, indicatorSelect] = [
	$('button#play'),
	$('button#pause'),
	$('button#reset'),
	$('#year-display'),
	$('select#indicator'),
];

playBtn.on('click', e => {
	pauseBtn.show();
	playBtn.hide();
	play();
});
pauseBtn.on('click', e => {
	console.log(e);
	pauseBtn.hide();
	playBtn.show();
	pause();
});
resetBtn.on('click', e => {
	reset();
});
indicatorSelect.on('change', e => {
	console.log(e.target.value);
	indicator = e.target.value;
	wrangleData(rawData);
	update();
});

function play() {
	interval = setInterval(() => {
		selectedYear = selectedYear === 2020 ? 2000 : selectedYear + 1;
		wrangleData(rawData);
		update();
	}, 2000);
}

function pause() {
	clearInterval(interval);
}

function reset() {
	selectedYear = 2000;
	wrangleData(rawData);
	update();
}

(async function init() {
	// prettier-ignore
	const data = await d3.dsv(';', '../electrorating_indicadores_financieros.csv');
	console.log(data);

	rawData = data;

	svg = d3
		.select('svg')
		.attr('width', width)
		.attr('height', height)
		.attr('transform', `translate(${margins.left}, 0)`);

	g = svg.append('g').attr('transform', `translate(${margins.left}, 0)`);

	stratify = d3
		.stratify()
		.id(d => d.id)
		.parentId(d => d.parent);

	treemap = (width, height) =>
		d3
			.treemap()
			.size([width, height])
			.paddingOuter(1)
			.paddingInner(1)
			.paddingTop(d => (d.depth === 1 ? 20 : 0));

	wrangleData(rawData);
	update();
})();

function update() {
	setDims();
	// console.log(selectedYear, chartData);

	svg.attr('width', width).attr('height', height);
	g.attr('width', width).attr('height', height);

	let root = stratify(hierachy)
		.sum(d => {
			let isLeaf = d.parent && d.parent !== 'Root';
			return isLeaf ? d.value : 0;
		})
		.sort((a, b) => b.value - a.value);

	treemap(width, height)(root);
	//
	d3.select('#chart-area')
		.selectAll('.text-div')
		.data([...root.descendants()])
		.join('div')
		.attr('class', 'text-div')
		.style('position', 'absolute')
		.style('width', d => d.x1 - d.x0 + 'px')
		.style('height', d => d.y1 - d.y0 + 'px')
		.transition()
		.duration(400)
		.attr('title', d => d.id)
		.style('left', d => d.x0 + margins.left + 'px')
		.style('top', d => d.y0 + 'px')
		.style('width', d => d.x1 - d.x0 + 'px')
		.style('height', d => d.y1 - d.y0 + 'px')
		.style('text-align', d => (d.depth === 1 ? 'center' : 'start'))
		.text(function (d) {
			// console.log(this);
			// console.log(this.style.width, d);
			if (!d.value) return '';

			const txts = {
				0: '',
				1: d.id,
				2: `${d.id.split(' ')[0]} ${d.id.split(' ')[1] || ''} ${format(
					d.value
				)}`,
			};
			return txts[d.depth];
		});

	// join rects

	d3.select('svg')
		.selectAll('.node')
		.data([...root.leaves()])
		.join('rect')
		.attr('class', d => {
			return d.depth === 1 ? 'node parent' : 'node';
		})
		.attr('width', d => d.x1 - d.x0 + 'px')
		.attr('height', d => d.y1 - d.y0 + 'px')
		.transition()
		.duration(400)
		.attr('title', d => d.id)
		.attr('x', d => d.x0 + 'px')
		.attr('y', d => d.y0 + 'px')
		.attr('width', d => d.x1 - d.x0 + 'px')
		.attr('height', d => d.y1 - d.y0 + 'px')
		.attr('opacity', d => d.height + 1 * 0.4)
		.attr('fill', (d, i, e) => {
			// console.log(colors(d.id));
			// return 'lightblue';
			return colors(d.id);

			// d.height;
			// const { r, g, b, opacity } = colors(i);
			// return `rgb(${r},${g},${b})`;
		});
	//
	yearDisplay.text(selectedYear);
}

function reduceBy(key, data) {
	return data.reduce((acc, player) => {
		acc[player[key]]
			? (acc[player[key]] += player.value)
			: (acc[player[key]] = player.value);
		return acc;
	}, {});
}

function format(x) {
	const s = d3.format('.2s')(x);
	switch (s[s.length - 1]) {
		case 'G':
			return s.slice(0, -1) + 'B'; // billions
		case 'k':
			return s.slice(0, -1) + 'K'; // thousands
	}
	return s;
}

function setDims() {
	margins = { top: 100, left: 60 };
	width = window.innerWidth - margins.left * 2;
	height = window.innerHeight - margins.top * 2;

	console.log({ height, width, left: margins.left, top: margins.top });
}

function wrangleData(data) {
	formatedData = data.map(item => ({
		value: Number(item['FACT_INDICATOR_Value_USD'] * 0.001),
		localValue: Number(item['FACT_INDICATOR_Value_Local'] * 0.001),
		year: Number(item['TIME_Year']),
		country: item['UTILITY_Country'],
		company: item['UTILITY_Name'],
		indicator: item['INDICATOR_Theme'],
	}));

	dataByYearObj = d3
		.nest()
		.key(d => d.year)
		.object(formatedData);

	chartData = dataByYearObj[selectedYear].filter(item =>
		indicator !== 'All' ? item.indicator === indicator : true
	);

	allSum = chartData.reduce((acc, item) => (acc += item.value), 0);

	hierarchyArrs = {
		root: [{ id: 'Root', parent: '', value: allSum }],
		parents: Object.entries(reduceBy('country', chartData)).map(
			([k, v]) => ({ id: k, value: v, parent: 'Root' })
		),
		companies: chartData.map(item => ({
			id: item.company,
			value: item.value,
			parent: item.country,
		})),
	};

	hierachy = hierarchyArrs.root
		.concat(hierarchyArrs.parents)
		.concat(hierarchyArrs.companies);

	console.log({ chartData, allSum, hierarchyArrs, hierachy });

	colors = d3.scaleOrdinal(d3.schemeBlues);
}

// function getFilteredData(formatedData) {
// 	const allSum = formatedData.reduce((a, b) => (a += b.value), 0);

// 	const reducedByPropObj = reduceBy(selectedProp, formatedData);
// 	console.log({ reducedByPropObj });

// 	byPropArr = Object.entries(reducedByPropObj).map(([k, v]) => ({
// 		id: k,
// 		value: v,
// 		parent: 'Root',
// 	}));
// 	console.log({ byPropArr });

// 	const companysByPropArr = formatedData.map(company => {
// 		const parentNode = byPropArr.find(
// 			node => node.id === String(company[selectedProp])
// 		);
// 		return {
// 			id: company.company,
// 			value: company.value,
// 			parent: parentNode.id,
// 		};
// 	});
// 	// items = byProp.map(item => item.id);
// 	const hierarchy = [{ id: 'Root', parent: '', value: allSum }]
// 		.concat(byPropArr)
// 		.concat(companysByPropArr);

// 	console.log({ reducedByPropObj, byPropArr, allSum, hierarchy });

// 	return hierarchy;
// }
