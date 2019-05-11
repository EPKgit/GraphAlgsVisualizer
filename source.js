var canvas = document.getElementById("gc");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gridHeight = 40;
const gridWidth = 40;
const tileSize = 19;
const tilePadding = 1;
const numWalls = 0;
const stepsPerSecond = 60;

const algType = {
	BFS: 0,
	DFS: 1,
	AStar: 2,
	Random: 3,
}
const inputState = {
	waitingForStart: 0,
	waitingForEnd: 1,
	done: 2
}
class Button
{
	constructor(x, y, w, h, ctx, txt, onclick = null)
	{
		Button.insts.push(this);
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
		this.ctx = ctx;
		this.txt = txt;
		this.onClick = onclick;
	}
	isInside(pos)
	{
		return pos.x > this.x && pos.x < this.x+this.width && pos.y < this.y+this.height && pos.y > this.y
	}
	draw()
	{
		this.ctx.fillStyle = "#000000";
		this.ctx.fillRect(this.x, this.y, this.width, this.height);
		this.ctx.fillStyle = "#FFFFFF";
		this.ctx.fillText(this.txt, this.x, this.y + this.height/2, this.width);
	}
	onClick()
	{
		alert("clicked");
	}
}

class Tile
{
	constructor(x, y, ctx)
	{
		this.x = x;
		this.y = y;
		this.visited = false;
		this.considered = false;
		this.current = false;
		this.start = false;
		this.end = false;
		this.wall = false;
		this.ctx = ctx;
		this.adj = [];
	}

	draw()
	{
		if(this.start) {
			this.ctx.fillStyle = "#f1f442";
		} else if(this.end) {
			this.ctx.fillStyle = "#FF0000";
		} else if(this.wall) {
			this.ctx.fillStyle = "#000000";
		} else if(this.current) {
			this.ctx.fillStyle = "#FF9933";
		} else if(this.visited) {
			this.ctx.fillStyle = "#0000FF";
		} else if(this.considered) {
			this.ctx.fillStyle = "#00FF00";
		} else {
			this.ctx.fillStyle = "#DDDDDD";
		}
		
		this.ctx.fillRect(this.x, this.y, tileSize, tileSize);
	}
}

class Grid {
	constructor(ctx) {
		this.ctx = ctx;
		this.tiles = new Array(gridWidth);
		for(var i = 0; i < gridWidth; ++i) {
			this.tiles[i] = new Array(gridHeight);
			for(var j = 0; j < gridHeight; ++j) {
				this.tiles[i][j] = new Tile(i * (tileSize + tilePadding), j * (tileSize + tilePadding), ctx);
			}
		}
		this.setupAdjacency();
	}
	setupAdjacency() {
		var x, y;
		for(var i = 0; i < gridWidth; ++i) {
			for(var j = 0; j < gridHeight; ++j) {
				x = 0; y = -1;
				if(i + x >= 0 && i + x < gridWidth && j + y >= 0 && j + y < gridHeight && !(x == 0 && y == 0)) {
					this.tiles[i + x][j + y].adj.push(this.tiles[i][j]);
				}
				x = 0; y = 1;
				if(i + x >= 0 && i + x < gridWidth && j + y >= 0 && j + y < gridHeight && !(x == 0 && y == 0)) {
					this.tiles[i + x][j + y].adj.push(this.tiles[i][j]);
				}
				x = 1; y = 0;
				if(i + x >= 0 && i + x < gridWidth && j + y >= 0 && j + y < gridHeight && !(x == 0 && y == 0)) {
					this.tiles[i + x][j + y].adj.push(this.tiles[i][j]);
				}
				x = -1; y = 0;
				if(i + x >= 0 && i + x < gridWidth && j + y >= 0 && j + y < gridHeight && !(x == 0 && y == 0)) {
					this.tiles[i + x][j + y].adj.push(this.tiles[i][j]);
				}
			}
		}
	}
	getTile(x, y) {
		return this.tiles[x][y];
	}
	get1dTiles() {
		var t = new Array();
		this.tiles.forEach(function(e) {
			e.forEach(function(f) {
				t.push(f);
			});
		});
		return t;
	}
	draw() {
		this.tiles.forEach(function(e) {
			e.forEach(function(f) {
				f.draw();
			});
		});
	}
}

class Driver {
	constructor(canvas, ctx) {
		this.ctx = ctx;
		this.canvas = canvas;
		this.x = 0;
		this.y = 0;
		this.last = { current: false };
		this.alg = algType.BFS;
		this.shouldReset = false;
		this.grid = new Grid(ctx);
		this.tiles = this.grid.get1dTiles();
		this.numWalls = numWalls;
		this.isrunning = false;
		this.intervalvalue = 0;
		this.stepsPerSecond = stepsPerSecond;
		this.reset();
	}
	step() {
		switch(this.alg) {
			case algType.BFS: this.BFSStep(); break;
			case algType.DFS: this.DFSStep(); break;
			case algType.AStar: this.AStarStep(); break;
			case algType.Random: this.RandomStep(); break;
		}
	}
	checkEndConditions() {
		if(this.q.length == 0) {
			alert("No more nodes to search");
			this.stopRunning();
			return true;
		}
		if(this.shouldReset) {
			alert("We already found the end");
			this.stopRunning();
			return true;
		}
		return false;
	}
	doNextNode(nextNode = this.q[0]) {
		this.q.splice(this.q.indexOf(nextNode), 1);
		this.last.current = false;
		var s = nextNode;
		this.last = s;
		s.current = true;
		s.visited = true;
		return s;
	}
	BFSStep() {
		if(this.checkEndConditions()) {
			return;
		}
		var s = this.doNextNode();
		if(s == this.end) {
			alert("found the end!");
			this.shouldReset = true;
			this.stopRunning();
			return;
		}
		s.adj.forEach(function(n) {
			if(!n.considered && !n.wall) {
				this.q.push(n);
				n.considered = true;
			}
		}, this);
	}
	DFSStep() {
		if(this.checkEndConditions()) {
			return;
		}
		var s = this.doNextNode();
		if(s == this.end) {
			alert("found the end!");
			this.shouldReset = true;
			this.stopRunning();
			return;
		}
		s.adj.forEach(function(n) {
			if(!n.considered && !n.wall) {
				this.q.unshift(n);
				n.considered = true;
			}
		}, this);
	}
	AStarStep() {
		if(this.checkEndConditions()) {
			return;
		}
		var s = this.doNextNode(this.AStarFindNode());
		if(s == this.end) {
			alert("found the end!");
			this.shouldReset = true;
			this.stopRunning();
			return;
		}
		s.adj.forEach(function(n) {
			if(!n.considered && !n.wall) {
				this.q.push(n);
				n.considered = true;
			}
		}, this);
	}
	AStarFindNode() {
		var bestNode = null;
		var bestVal = Infinity;
		var curr;
		var dist;
		for(var i = 0; i < this.q.length; ++i) {
			curr = this.q[i];
			dist = Math.sqrt((curr.x - this.end.x) * (curr.x - this.end.x) + (curr.y - this.end.y) * (curr.y - this.end.y));
			if(dist < bestVal)
			{
				bestNode = curr;
				bestVal = dist;
			}
		}
		return bestNode;
	}
	RandomStep() {
		if(this.checkEndConditions()) {
			return;
		}
		var s = this.doNextNode(this.q[Math.floor(Math.random() * this.q.length)]);
		if(s == this.end) {
			alert("found the end!");
			this.shouldReset = true;
			this.stopRunning();
			return;
		}
		s.adj.forEach(function(n) {
			if(!n.considered && !n.wall) {
				this.q.push(n);
				n.considered = true;
			}
		}, this);
	}
	update() {
		this.draw();
	}
	draw() {
		this.grid.draw();
		Button.insts.forEach( function(e) {
			e.draw();
		});
	}
	addTile(tile) {
		this.tiles.push(tile);
	}
	input(x, y)
	{
		var tile = this.grid.getTile(x, y);
		switch(this.instat) {
			case inputState.waitingForStart:
				this.q.push(tile);
				this.start = tile;
				tile.start = true;
				tile.considered = true;
				this.instat = inputState.waitingForEnd;
				break;
			case inputState.waitingForEnd:
				this.end = tile;
				tile.end = true;
				this.instat = inputState.done;
				break;
			case inputState.done:
				tile.wall = !tile.wall;
				break;
		}		
	}
	reset() {
		this.instat = inputState.waitingForStart;
		this.stopRunning();
		this.shouldReset = false;
		this.q = new Array();
		this.tiles.forEach(function(e) {
			e.visited = false;
			e.considered = false;
			e.current = false;
			e.start = false;
			e.end = false;
			e.wall = false;
		});
		this.generateWalls();
	}
	generateWalls() {
		this.tiles.forEach(function(e) {
			e.wall = false;
		});
		var r1 = Math.floor(this.tiles.length * Math.random());		
		for(var i = 1; i <= this.numWalls; ++i) {
			while(this.tiles[r1].wall || this.tiles[r1].start || this.tiles[r1].end) {
				r1 = Math.floor(this.tiles.length * Math.random());
			}
			this.tiles[r1].wall = true;
		}
	}
	setAlgtype(a) {
		this.alg = a;
	}
	startRunning() {
		if(!this.isrunning) {
			this.isrunning = true;
			function temp() { d.step(); }
			this.intervalvalue = setInterval(temp, 1000 / this.stepsPerSecond);
		}
	}
	stopRunning() {
		if(this.isrunning) {
			clearInterval(this.intervalvalue);
			this.isrunning = false;
		}
	}
}

var d = new Driver(canvas, ctx);

Button.insts = new Array();
canvas.addEventListener('click', function(evt) {
	var rect = canvas.getBoundingClientRect();
	var pos = {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	}
	Button.insts.forEach(function(e) {
		if(e.isInside(pos)) {
			e.onClick();
		}
	});
	if(pos.x < gridWidth * (tileSize + tilePadding) && pos.y < gridWidth * (tileSize + tilePadding)) {
		d.input(Math.floor(pos.x / (tileSize + tilePadding)), Math.floor(pos.y / (tileSize + tilePadding)));
	}
});



var b1 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 1, 40, 30, ctx, "Step", function() { d.step();  });
var b2 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 2, 40, 30, ctx, "Reset", function() { d.reset(); });

var b10 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 3, 40, 30, ctx, "Run", function(){ 
	if(d.isrunning) {
		d.stopRunning();
	} else {
		d.startRunning();
	}
});
b10.draw = function() {
	if(d.isrunning) {
		this.txt = "Stop";
	} else {
		this.txt = "Run";
	}
	this.ctx.fillStyle = "#000000";
	this.ctx.fillRect(this.x, this.y, this.width, this.height);
	this.ctx.fillStyle = "#FFFFFF";
	this.ctx.fillText(this.txt, this.x, this.y + this.height/2, this.width);
}

var b15 = new Button((gridWidth + 1) * (tileSize + tilePadding) + 50, gridHeight * (tileSize + tilePadding) / 10 * 4, 90, 30, ctx, "StepPerS:" + d.stepsPerSecond, function() { this.txt = "StepPerS:" + d.stepsPerSecond});
var b14 = new Button((gridWidth + 1) * (tileSize + tilePadding) + 150, gridHeight * (tileSize + tilePadding) / 10 * 4, 40, 30, ctx, "Faster", function() {
	d.stepsPerSecond++;
	if(d.isrunning){
		d.stopRunning();
		d.startRunning();
	}
	b15.onClick();
});
var b13 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 4, 40, 30, ctx, "Slower", function() {
	d.stepsPerSecond--;
	if(d.isrunning){
		d.stopRunning();
		d.startRunning();
	}
	b15.onClick();
});

var b3 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 5, 40, 30, ctx, "BFS", function() { d.setAlgtype(algType.BFS); });
var b4 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 6, 40, 30, ctx, "DFS", function() { d.setAlgtype(algType.DFS); });
var b4 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 7, 40, 30, ctx, "A*", function() { d.setAlgtype(algType.AStar); });
var b4 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 8, 40, 30, ctx, "Random", function() { d.setAlgtype(algType.Random); });

var b5 = new Button((gridWidth + 1) * (tileSize + tilePadding) + 70, gridHeight * (tileSize + tilePadding) / 10 * 9, 40, 30, ctx, "Walls:" + d.numWalls, function() { this.txt = "Walls:" + d.numWalls; d.generateWalls();});
var b10 = new Button((gridWidth + 1) * (tileSize + tilePadding), gridHeight * (tileSize + tilePadding) / 10 * 9, 20, 20, ctx, "-100", function() { d.numWalls-=100; d.reset(); b5.onClick(); });
var b11 = new Button((gridWidth + 1) * (tileSize + tilePadding) + 20, gridHeight * (tileSize + tilePadding) / 10 * 9, 20, 20, ctx, "-25", function() { d.numWalls-=25; d.reset(); b5.onClick(); });
var b7 = new Button((gridWidth + 1) * (tileSize + tilePadding) + 40, gridHeight * (tileSize + tilePadding) / 10 * 9, 20, 20, ctx, "-5", function() { d.numWalls-=5; d.reset(); b5.onClick(); });
var b8 = new Button((gridWidth + 1) * (tileSize + tilePadding) + 120, gridHeight * (tileSize + tilePadding) / 10 * 9, 20, 20, ctx, "+5", function() {  d.numWalls+=5; d.reset(); b5.onClick(); });
var b9 = new Button((gridWidth + 1) * (tileSize + tilePadding) + 140, gridHeight * (tileSize + tilePadding) / 10 * 9, 20, 20, ctx, "+25", function() {  d.numWalls+=25; d.reset(); b5.onClick(); });
var b12 = new Button((gridWidth + 1) * (tileSize + tilePadding) + 160, gridHeight * (tileSize + tilePadding) / 10 * 9, 20, 20, ctx, "+100", function() {  d.numWalls+=100; d.reset(); b5.onClick(); });

var b16 = new Button(0, gridHeight * (tileSize + tilePadding), gridWidth * (tileSize + tilePadding), 120, ctx, "");
b16.draw = function() {
	this.ctx.fillStyle = "#000000";
	this.ctx.fillRect(this.x, this.y, this.width, this.height);
	this.ctx.fillStyle = "#FFFFFF";
	this.ctx.fillText("Click 1: Place Start", this.x, this.y + this.height / 4 * 1, this.width);
	this.ctx.fillText("Click 2: Place End", this.x, this.y + this.height / 4 * 2, this.width);
	this.ctx.fillText("Click 3+: ToggleWalls", this.x, this.y + this.height / 4 * 3, this.width);
}

function run()
{
	d.update();
}
var stop = setInterval(run, 1000/60);