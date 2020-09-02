function __Animation__(){
	this.__proto__.deltaTime = Date.now() - this.__proto__.__time__;
	requestAnimationFrame(__Animation__);
	this.__proto__.canvas.clearRect(0,0,this.game.canvas.width,this.game.canvas.height);
	let game = this.game;
	this.__proto__.canvas.drawImage(game.canvas,0,0);
	this.game.room.update(this.deltaTime);
	this.__proto__.Times++;
	this.__proto__.sumTime += this.__proto__.deltaTime;
	if(this.debug && this.__proto__.Times == 20){
		let _FPS = (20000/this.__proto__.sumTime) | 0;
		this.__proto__.sumTime = 0;
		this.__proto__.Times = 0;
		//打印FPS帧率
	}
	this.__proto__.__time__ = Date.now();
}
function Game(_WIDTH,_HEIGHT){
	if(!_WIDTH && !_HEIGHT){
		game.width  = window.innerWidth;
		game.height = window.innerHeight;
	}else{
		game.width  = _WIDTH;
		game.height = _HEIGHT;
	}
	//创建缓冲画布
	let canvas = document.createElement("canvas");
	//统一渲染画布的宽高
	canvas.width  = game.width;
	canvas.height = game.height;
	//显示缓冲画布
	document.body.insertBefore(canvas,game);
	//默认关闭调试
	this.debug = false;
	//画布上级节点默认背景（黑色）
	
	// game.style.background = "#000000";
	//返回 缓冲画布的方法属性，后期优化(去掉不用的，添加有用的)！！！
	this.game = canvas.getContext("2d");
	//渲染画布
	this.__proto__.canvas = game.getContext("2d");


	//处理数据传值的问题，（待优化）！！！
	this.game.room = {name:null};
	//更改循环刷新的参数
	__Animation__ = __Animation__.bind(this);
	//添加房间字段
	this.room = new Room(this.game);
	//添加数据存储系统
	this.data = new Data();
}
//时间差
Game.prototype.deltaTime = 0;
//时间戳
Game.prototype.__time__ = Date.now();
//每Times计算帧率
Game.prototype.Times = 0;
//在Times次中，时间差的总和
Game.prototype.sumTime = 0;

//房间系统管理器
function Room(_game){
	let _this = this;

	//Room对象的属性
	
	//房间列表
	_this.data = [];
	//房间数量
	_this.num  = 0;
	//游戏数据对象
	_this.game = _game;

	//Room对象的方法
	
	//加载房间数据      两种格式   string加载房间文件  object自动创建房间
	this.add = function(_room){
		let data = 0;
		if(typeof _room == "object")data = _room;
		//可检查数据是否已损坏
		//根据json文件，改数据时对应文件
		_this.data.unshift(data);
		//保守写法，效率低 _this.num = _this.data.length;
		_this.num++;
		// $.getScript('./room/'+_room+'.js',function(e){console.log(e);data = 2;});
		return data;
	}
	//载入房间，开始房间
	this.load = function(_room){
		//数据错误可以自动弥补,待设计
		_nowRoom = _this.game.room;
		//加载文件的数据 （将淘汰）
		if(typeof _room == "string"){
			for(let i = 0;i < _this.data.length;i++){
				if(_room == _this.data[i].name){
					_room = _this.data[i];
					break;
				}
			}
		}else if(typeof _room == "object"){
			_room = _room;
		}else{
			//参数传值错误
			_room = {};
		}
		if(_room.name != undefined && _room.name != _nowRoom.name){
			//加载房间，记录当前的房间
			this.game.room = _room;
			console.log(this);
		}else{
			//重复加载处理
			console.log("已加载");
		}
		//房间预备工作
		this.game.room.preload();
		this.game.room.create();
		//房间开始渲染
		__Animation__();

	}
}

//数据系统管理器
function Data(){
	
}