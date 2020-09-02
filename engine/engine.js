const Engine = new function(){
	document.onvisibilitychange = function(){
		Engine.System.BACK = !Engine.System.BACK;
	}
	this.Game = class Game{
		constructor(config){

			this.room = new class RoomManager{
				constructor(game){
					this.game = game;
					this.main = null;
					this.data = {};
					this.progress = "onload";
					this.__proto__.index = 0;
					document.body.oncontextmenu = function(){return false;}
				}
				

				add (room){
					if(this.data[room.name])console.warn(room.name,"覆盖");
					this.data[room.name] = new Engine.Room(this.game,room);
				}

				start (name){
					if(this.data[name]){
						if(this.index != 0){
							clearInterval(this.index);
							this.main.destory();
							this.main = null;
							this.progress = "onload";
						}
						this.game.time.roomInit();
						this.main = this.data[name];
						this.main.onload();
						this.__proto__.index = setInterval(this.main.fixed,this.game.time.fixedTime*1000);
						this.main.load.onload();
						this.main.load.check();
					}else console.error("房间",name,"不存在");
				}
			}(this)

			this.render = new class RenderManager{
				constructor(game){
					this.game = game;
					const canvas = document.createElement('canvas');
					canvas.width = Engine.System.WIDTH;
					canvas.height = Engine.System.HEIGHT;
					canvas.style.backgroundColor = "#000";
					this.main = canvas.getContext('2d');
					this.main.imageSmoothingEnabled = false;
					document.body.append(this.main.canvas);
				}

				data = [];

				create(width,height,camera=null){
					const canvas = document.createElement('canvas');
					width = width?width:this.main.canvas.width;
					height = height?height:this.main.canvas.height;
					canvas.width = width;
					canvas.height = height;
					const render = canvas.getContext('2d');
					render.imageSmoothingEnabled = false;
					if(camera)this.data.push(camera);
					return render;
				}

				rendering(renders){

					this.main.clearRect(0,0,this.main.canvas.width,this.main.canvas.height);
					for(var i in renders){
						this.main.save();
						this.main.drawImage(renders[i].render.canvas,renders[i].screenX,renders[i].screenY);
						this.main.restore();
					}
				}
			}(this)

			this.time = new class TimeManager{
				constructor(game){
					this.game = game;

					this.realTime = Date.now();
					this.updateTime = 0;
					this.fixedTime = 0.02;
					this.timeCount = -1;

					this.roomStartTime = 0;
					this.roomTimeCount = 0;
					this.roomTime = 0;
					this.roomDetlaTime = 0;
				}
				roomInit(){
					this.roomStartTime = this.updateTime;
					this.roomTimeCount = 0;
				}
				update(t){
					this.roomDetlaTime = ((t - this.updateTime)*1000|0)/1000;
					this.updateTime = t;
					this.timeCount++;
					this.roomTimeCount++;
					this.roomTime = this.updateTime - this.roomStartTime;
				}

			}(this)

			this.__proto__.update = this.update.bind(this);
			this.update();
			this.__proto__.dt = 0;
		}
		update(t=0){
			requestAnimationFrame(this.update);
			if(Engine.System.BACK)requestIdleCallback(this.update);
			this.time.update(t);
			if(this.room.main && this.room.progress == "update"){
				//房间循环
				this.room.main.cameras.update(this.time.roomDetlaTime);
				this.room.main.update(t,this.time.roomDetlaTime);
				this.room.main.cameras.rendering();
				this.render.rendering(this.room.main.cameras.data);

			}
		}
		
	}

	this.Room = class Room{
		constructor(game,room){
			if(room.onload)this.onload = room.onload;
			else this.onload = this.onload.bind(this);
			if(room.create)this.create = room.create;
			else this.create = this.create.bind(this);
			if(room.fixed)this.fixed = room.fixed;
			else this.fixed = this.fixed.bind(this);
			if(room.update)this.update = room.update;
			else this.update = this.update.bind(this);
			this.game = game;
			this.data = [];
			this.name = room.name;
			this.lights = new class LightManager{
				constructor(room){
					this.brightness = 0.9;
					this.render = room.game.render.create();
					// document.body.append(this.render.canvas);
					this.update = function(){
						this.render.clearRect(0,0,this.render.canvas.width,this.render.canvas.height);
					}
					this.rendering = function(camera){
						this.render.save();
						this.render.globalCompositeOperation = "source-out";
						this.render.fillStyle = "rgba(0,0,0,"+this.brightness+")";
						this.render.fillRect(0,0,this.render.canvas.width,this.render.canvas.height);
						this.render.restore();
						camera.render.save();
						camera.render.translate(-camera.centerX,-camera.centerY);
						camera.render.drawImage(this.render.canvas,0,0);
						camera.render.restore();
					}
				}
			}(this);
			this.cameras = new class CameraManager{
				constructor(room){
					this.data = [new Engine.GameObjects.Camera(room,0,0)];
					this.main = this.data[0];
					this.update = function(dt){
						for(var i in this.data){
							this.data[i].update(dt);
						}
					}
					this.rendering = function(){
						for(var i in this.data){
							this.data[i].rendering();
						}
					}
				}
			}(this);
			

			this.load	= new Engine.Loader(game);
			this.add	= new class GameObject{
				constructor(room){
					this.gameObject = function(gameObject){
						this.data.push(gameObject);
						return gameObject;
					}.bind(room);

					this.image = function(key,x=0,y=0){
						const gameObject = new Engine.GameObjects.Image(this,key,x,y);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.sprite = function(key,x=0,y=0,index=0){
						const gameObject = new Engine.GameObjects.Sprite(this,key,x,y,index);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.text = function(text,x=0,y=0,options){
						const gameObject = new Engine.GameObjects.Text(this,text,x,y,options);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.audio = function(key,x=0,y=0,volume=1){
						const gameObject = new Engine.GameObjects.Audio(this,key,x,y,volume);
						if(gameObject.audio)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.camera = function(x=0,y=0){
						const gameObject = new Engine.GameObjects.Camera(this,x,y);
						if(gameObject.render)this.cameras.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.rectangle = function(x=0,y=0,width=10,height=10){
						const gameObject = new Engine.GameObjects.Rectangle(this,x,y,width,height);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.circle = function(x=0,y=0,radius=10){
						const gameObject = new Engine.GameObjects.Circle(this,x,y,radius);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.arc = function(x=0,y=0,radius=10,start=0,end=360){
						const gameObject = new Engine.GameObjects.Arc(this,x,y,radius,start,end);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.polygon = function(x,y,data=[]){
						const gameObject = new Engine.GameObjects.Polygon(this,x,y,data);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.container = function(x,y,obj=[]){
						const gameObject = new Engine.GameObjects.Container(this,x,y,obj);
						this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.group = function(x,y,target=null,max=5){
						const gameObject = new Engine.GameObjects.Group(this,x,y,target,max);
						this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.tilemap = function(key,x=0,y=0){
						const gameObject = new Engine.GameObjects.Tilemap(this,x,y,key);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.light = function(x,y){
						const gameObject = new Engine.GameObjects.Light(this,x,y);
						if(gameObject.render)this.data.push(gameObject);
						return gameObject;
					}.bind(room);
					this.particles = function(x,y,target){
						const gameObject = new Engine.GameObjects.Particles(this,x,y,target);
						this.data.push(gameObject);
						return gameObject;
					}.bind(room);
				}
			}(this);
		}

		onload (){}

		create (){}

		fixed (){}

		update (){}

		destory(){
			this.load.clear();
			this.data = [];
		}

	}

	this.GameObjects = new class GameObjects{
		constructor(){

		}

		GameObject = class GameObject{
			constructor(room,x,y){
				this.room = room;
				this.type = 'GameObject';
				this.x = x;
				this.y = y;
				this.width = 0;
				this.height = 0;
				this.anchorX = 0.5;
				this.anchorY = 0.5;
				this.scaleX = 1;
				this.scaleY = 1;
				this.rotate = 0;
				this.visible = true;
				this.alpha = 1;
				this.parent = room;
				this.__proto__.destory = function(){
					const index = this.parent.data.indexOf(this);
					if(index > -1){
						this.parent.data.splice(index,1);
						if(this.parent.type == 'group'){
							this.parent.check();
						}
					}
				}
				this.__proto__.setPosition = function(x,y){
					if(typeof x == 'number' && typeof y == 'number'){
						this.x = x;
						this.y = y;
					}
				}
				this.__proto__.getPosition = function(){
					return {x:this.x,y:this.y};
				}
				this.__proto__.setScale = function(x,y){
					if(typeof x == 'number'){
						this.scaleX = x;
						if(typeof y == 'number')this.scaleY = y;
						else this.scaleY = x;
					}
				}
				this.__proto__.getScale = function(){
					return {scaleX:this.scaleX,scaleY:this.scaleY};
				}
				this.__proto__.setRotation = function(rotate){
					if(rotate && typeof rotate == 'number')this.rotate = rotate;
				}
				this.__proto__.getRotation = function(){
					return this.rotate;
				}
				this.__proto__.setVisible = function(visible){
					if(typeof visible == 'boolean')this.visible = visible;
				}
				this.__proto__.getVisible = function(){
					return this.visible;
				}
				this.__proto__.setAlpha = function(alpha){
					if(typeof alpha == 'number'){
						if(alpha<0)alpha=0;
						else if(alpha>1)alpha=1;
						this.alpha = alpha;
					}
				}
				this.__proto__.getAlpha = function(){
					return this.alpha;
				}
				this.__proto__.setAnchor = function(x,y){
					if(typeof x == 'number'){
						this.anchorX = x;
						if(typeof y == 'number')this.anchorY = y;
						else this.anchorY = x;
					}
				}
				this.__proto__.getAnchor = function(){
					return {anchorX:this.anchorX,anchorY:this.anchorY};
				}
				this.__proto__.setSize = function(w,h){
					if(typeof w == 'number'){
						this.width = w;
						if(typeof h == 'number')this.height = h;
						else this.height = w;
					}
				}
				this.__proto__.getSize = function(){
					return {width:this.width,height:this.height};
				}
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				if(this.render)camera.render.drawImage(this.render.canvas,0,0,this.width,this.height,-this.width*this.anchorX,-this.height*this.anchorY,this.width,this.height);
				camera.render.restore();
			}
		}

		Image = class Image extends this.GameObject{
			constructor(room,key,x,y){
				super(room,x,y);
				const src = this.room.load.data[key];
				if(src && src.camplete && src.type == 'image'){
					this.type = src.type;
					this.render = src.data;
					this.width = this.render.width;
					this.height = this.render.height;
				}else console.error("键",key," 资源错误");
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				camera.render.drawImage(this.render,-this.render.width*this.anchorX,-this.render.height*this.anchorY);
				camera.render.restore();
			}
		}

		Sprite = class Sprite extends this.GameObject{
			constructor(room,key,x,y,index){
				super(room,x,y);
				const src = this.room.load.data[key];
				if(src && src.camplete && src.type == 'sprite'){
					this.type = src.type;
					this.render = src.data;
					this.width = src.width;
					this.height = src.height;
					this.index = index;
					this.sprite = [];
					for(var i = 0;i < this.render.height;i += this.height){
						for(var j = 0;j < this.render.width;j += this.width)this.sprite.push(j,i);
					}
				}else console.error("键",key," 资源错误");

				this.__proto__.setIndex = function(index){
					if(typeof index == 'number'){
						if(index < 0)index = 0;
						else if(index*2 >= this.sprite.length)index = this.sprite.length/2-1;
						this.index = index;
					}
						
				}
				this.__proto__.getIndex = function(){
					return this.index;
				}
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				var index = this.index*2;
				camera.render.drawImage(this.render,this.sprite[index],this.sprite[index+1],this.width,this.height,-this.width*this.anchorX,-this.height*this.anchorY,this.width,this.height);
				camera.render.restore();
			}
		}

		Text = class Text extends this.GameObject{
			constructor(room,text,x,y,options){
				super(room,x,y);
				this.type = "text";
				this.render = room.game.render.create();
				this.text = text;
				this._text = '';

				this.font			= options['font']?options['font']:this.render.font;
				this.fillStyle		= options['fillStyle']?options['fillStyle']:this.render.fillStyle;
				this.strokeStyle	= options['strokeStyle']?options['strokeStyle']:this.render.strokeStyle;
				this.textAlign		= options['textAlign']?options['textAlign']:this.render.textAlign;
				this.textBaseline	= options['textBaseline']?options['textBaseline']:'top';
				this.shadowOffsetX	= options['shadowOffsetX']?options['shadowOffsetX']:this.render.shadowOffsetX;
				this.shadowOffsetY	= options['shadowOffsetY']?options['shadowOffsetY']:this.render.shadowOffsetY;
				this.shadowBlur		= options['shadowBlur']?options['shadowBlur']:this.render.shadowBlur;
				this.shadowColor	= options['shadowColor']?options['shadowColor']:this.render.shadowColor;

				this.__proto__.setText = function(text){
					if(text){
						text = text.toString();
						this.text = text;
					}
				}
				this.__proto__.getText = function(){
					return this.text;
				}
			}

			update(){
				if(this.check()){
					console.log('TextUpdate');
					this.render.clearRect(0,0,this.render.canvas.width,this.render.canvas.height);
					this.width = this.render.measureText(this.text).width;
					this.height = (parseFloat(this.font)*110|0)/100;
					this.render.fillText(this.text,0,0);
				}
			}
			check(){
				var f = false;
				if(this.text != this._text){
					f = true;
					this._text = this.text.toString();
				}
				if(this.font != this.render.font){
					f = true;
					this.render.font = this.font;
				}
				if(this.render.fillStyle != this.fillStyle){
					f = true;
					this.render.fillStyle = this.fillStyle;
				}
				if(this.render.strokeStyle != this.strokeStyle){
					f = true;
					this.render.strokeStyle = this.strokeStyle;
				}
				if(this.render.textAlign != this.textAlign){
					f = true;
					this.render.textAlign = this.textAlign;
				}
				if(this.render.textBaseline != this.textBaseline){
					f = true;
					this.render.textBaseline = this.textBaseline;
				}
				if(this.render.shadowOffsetX != this.shadowOffsetX){
					f = true;
					this.render.shadowOffsetX = this.shadowOffsetX;
				}
				if(this.render.shadowOffsetY != this.shadowOffsetY){
					f = true;
					this.render.shadowOffsetY = this.shadowOffsetY;
				}
				if(this.render.shadowBlur != this.shadowBlur){
					f = true;
					this.render.shadowBlur = this.shadowBlur;
				}
				if(this.render.shadowColor != this.shadowColor){
					f = true;
					this.render.shadowColor = this.shadowColor;
					this.shadowColor = this.render.shadowColor;
				}
				return f;
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				camera.render.drawImage(this.render.canvas,0,0,this.width,this.height,-this.width*this.anchorX,-this.height*this.anchorY,this.width,this.height);
				camera.render.restore();
			}
		}

		Audio = class Audio extends this.GameObject{
			constructor(room,key,x,y,volume){
				super(room,x,y);
				this.type = "audio";
				this.render = null;
				this.autoplay = false;
				this.loop = false;
				this.speed = 1;

				this.volume = volume;
				this.audio = room.load.data[key].data.cloneNode();

				this.__proto__.play = function(){
					this.audio.play();
				}
				this.__proto__.pause = function(){
					this.audio.pause();
				}
				this.__proto__.setAutoPlay = function(autoplay){
					if(typeof autoplay == 'boolean'){
						this.autoplay = autoplay;
					}
				}
				this.__proto__.getAutoPlay = function(){
					return this.autoplay;
				}
				this.__proto__.setLoop = function(loop){
					if(typeof loop == 'boolean'){
						this.loop = loop;
					}
				}
				this.__proto__.getLoop = function(){
					return this.loop;
				}
				this.__proto__.setVolume = function(volume){
					if(typeof volume == 'number'){
						if(volume < 0)volume = 0;
						else if(volume > 1)volume = 1;
						this.volume = volume;
					}
				}
				this.__proto__.getVolume = function(){
					return this.volume;
				}
				this.__proto__.setSpeed = function(speed){
					if(typeof speed == 'number'){
						this.speed = speed;
					}
				}
				this.__proto__.getSpeed = function(){
					return this.speed;
				}
			}

			update(){
				this.audio.autoplay = this.autoplay;
				this.audio.loop = this.loop;
				this.audio.volume = this.volume;
				this.audio.playbackspeed = this.speed;
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				if(this.render)camera.render.drawImage(this.render.canvas,0,0,this.width,this.height,-this.width*this.anchorX,-this.height*this.anchorY,this.width,this.height);
				camera.render.restore();
			}
		}

		Camera = class Camera extends this.GameObject{
			constructor(room,x,y){
				super(room,x,y);
				this.type = 'camera';
				this.x = 0;
				this.y = 0;
				this.screenX = 0;
				this.screenY = 0;
				this.scale = 1;
				this.backgroundColor = "#000";
				this.render = this.room.game.render.create(null,null,this);
				this.width = this.render.canvas.width;
				this.height = this.render.canvas.height;
				this.update();

				this.__proto__.setBackgroungColor = function(color){
					this.backgroundColor = color;
				}
			}

			update(dt){
				this.centerX = this.render.canvas.width/2;
				this.centerY = this.render.canvas.height/2;
				this.room.lights.update();
				var data = this.room.data;
				for(var i in data){
					if(data[i].update)data[i].update(dt);
				}
			}
			rendering(){
				const data = this.room.data;
				this.render.clearRect(0,0,this.render.canvas.width,this.render.canvas.height);
				this.render.save();
				this.render.globalAlpha *= this.alpha;

				this.render.save();
				this.render.fillStyle = this.backgroundColor;
				this.render.fillRect(0,0,this.render.canvas.width,this.render.canvas.height);
				this.render.restore();
				
				this.render.translate(this.centerX,this.centerY);
				this.room.lights.render.save();
				this.room.lights.render.translate(this.centerX,this.centerY);
				this.render.scale(this.scaleX,this.scaleY);
				this.render.rotate(this.rotate*Math.PI/180);
				for(var i in data){
					// if(data[i].update)data[i].update();
					if(data[i].visible && data[i].rendering){
						data[i].rendering(this);
					}
				}
				this.room.lights.render.restore();
				this.room.lights.rendering(this);
				this.render.restore();
			}
		}

		Rectangle = class Rectangle extends this.GameObject{
			constructor(room,x,y,w,h){
				super(room,x,y);
				this.type = 'rectangle';
				this.width = w;
				this.height = h;
				this._width = 0;
				this._height = 0;
				this.color = "#000";
				this.render = room.game.render.create();

				this.__proto__.setColor = function(color){
					this.color = color;
				}
				this.__proto__.getColor = function(){
					return this.color;
				}

			}

			update(){
				if(this.check()){
					console.log('RectangleUpdate');
					this.render.clearRect(0,0,this.render.canvas.width,this.render.canvas.height);
					this.render.fillRect(0,0,this.width,this.height);
				}
			}

			check(){
				var f = false;
				if(this.color != this.render.fillStyle){
					f = true;
					this.render.fillStyle = this.color;
					this.color = this.render.fillStyle;
				}
				if(this._width != this.width){
					f = true;
					this._width = this.width;
				}
				if(this._height != this.height){
					f = true;
					this._height = this.height;
				}
				return f;
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				camera.render.drawImage(this.render.canvas,0,0,this.width,this.height,-this.width*this.anchorX,-this.height*this.anchorY,this.width,this.height);
				camera.render.restore();
			}
		}

		Circle = class Circle extends this.GameObject{
			constructor(room,x,y,radius){
				super(room,x,y);
				this.type = 'circle';
				this.radius = radius;
				this._radius = 0;
				this.width = this.radius*2;
				this.height = this.radius*2;
				this.color = '#000';
				this.render = room.game.render.create();

				this.__proto__.setColor = function(color){
					this.color = color;
				}
				this.__proto__.getColor = function(){
					return this.color;
				}
				this.__proto__.setRadius = function(radius){
					if(typeof radius == 'number' && radius > 0){
						this.radius = radius;
					}
				}
				this.__proto__.getRadius = function(){
					return this.radius;
				}
			}

			update(){
				if(this.check()){
					console.log('CircleUpdate');
					this.render.clearRect(0,0,this.render.canvas.width,this.render.canvas.height);
					this.render.beginPath();
					this.render.arc(this.width/2,this.height/2,this.radius,0,2*Math.PI);
					this.render.fill();
				}
			}

			check(){
				var f = false;
				if(this._radius != this.radius){
					f = true;
					this._radius = this.radius;
				}
				this.width = this.height = this.radius*2+10;
				if(this.render.fillStyle != this.color){
					f = true;
					this.render.fillStyle = this.color;
					this.color = this.render.fillStyle;
				}
				return f;
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				camera.render.drawImage(this.render.canvas,0,0,this.width,this.height,-this.width*this.anchorX,-this.height*this.anchorY,this.width,this.height);
				camera.render.restore();
			}
		}

		Arc = class Arc extends this.GameObject{
			constructor(room,x,y,radius,start,end){
				super(room,x,y);
				this.type = 'arc';
				this.radius = radius;
				this._radius = 0;
				this.lineWidth = 0;
				this.width = this.radius*2;
				this.height = this.radius*2;
				this.color = '#000';
				this.start = start;
				this.end = end;
				this._start = 0;
				this._end = 0;
				this.render = room.game.render.create();

				this.__proto__.setColor = function(color){
					this.color = color;
				}
				this.__proto__.getColor = function(){
					return this.color;
				}
				this.__proto__.setRadius = function(radius){
					if(typeof radius == 'number' && radius > 0){
						this.radius = radius;
					}
				}
				this.__proto__.getRadius = function(){
					return this.radius;
				}
				this.__proto__.setLineWidth = function(lineWidth){
					if(typeof lineWidth == 'number' && lineWidth > 0){
						this.lineWidth = lineWidth;
					}
				}
				this.__proto__.getLineWidth = function(){
					return this.lineWidth;
				}
				this.__proto__.setArc = function(start,end){
					if(typeof start == 'number' && typeof end == 'number'){
						this.start = start;
						this.end = end;
					}
				}
			}

			update(){
				if(this.check()){
					console.log('ArcUpdate');
					this.render.clearRect(0,0,this.render.canvas.width,this.render.canvas.height);
					this.render.lineCap = 'round';
					this.render.beginPath();
					this.render.arc(this.width/2,this.height/2,this.radius,(this.start-90)*Math.PI/180,(this.end-90)*Math.PI/180);
					this.render.stroke();
				}
			}

			check(){
				var f = false;
				if(this._radius != this.radius){
					f = true;
					this._radius = this.radius;
				}
				if(this.render.strokeStyle != this.color){
					f = true;
					this.render.strokeStyle = this.color;
					this.color = this.render.strokeStyle;
				}
				if(this.render.lineWidth != this.lineWidth){
					f = true;
					this.render.lineWidth = this.lineWidth;
					this.lineWidth = this.render.lineWidth;
				}
				this.width = this.height = this.radius*2+this.lineWidth+10;
				if(this.start != this._start){
					f = true;
					this._start = this.start;
				}
				if(this.end != this._end){
					f = true;
					this._end = this.end;
				}
				return f;
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				camera.render.drawImage(this.render.canvas,0,0,this.width,this.height,-this.width*this.anchorX,-this.height*this.anchorY,this.width,this.height);
				camera.render.restore();
			}
		}

		Polygon = class Polygon extends this.GameObject{
			constructor(room,x,y,data){
				super(room,x,y);
				this.type = 'polygon';
				this.render = room.game.render.create();
				this.color = '#000';

				this.polygon = data;
				this._polygon = [...data];

				this.__proto__.setColor = function(color){
					this.color = color;
				}
				this.__proto__.getColor = function(){
					return this.color;
				}
				this.__proto__.setPolygon = function(data){
					if(data.length % 2 == 0){
						this.polygon = data;
					}
				}
				this.__proto__.getPolygon = function(){
					return this.polygon;
				}
			}

			update(){
				if(this.check()){
					console.log('PolygonUpdate');
					this.render.clearRect(0,0,this.render.canvas.width,this.render.canvas.height);
					this.render.save();
					this.render.translate(this.render.canvas.width/2,this.render.canvas.height/2)
					this.render.beginPath();
					var maxX,minX,maxY,minY;
					maxX = minX = this.polygon[0];
					maxY = minY = this.polygon[1];
					this.render.moveTo(this.polygon[0],this.polygon[1]);
					for(var i = 2;i < this.polygon.length;i+=2){
						if(this.polygon[i] < minX)minX = this.polygon[i];
						else if(this.polygon[i] > maxX)maxX = this.polygon[i];
						if(this.polygon[i+1] < minY)minY = this.polygon[i+1];
						else if(this.polygon[i+1] > maxY)maxY = this.polygon[i+1];
						this.render.lineTo(this.polygon[i],this.polygon[i+1]);
					}
					this.width = maxX - minX;
					this.height = maxY - minY;
					this.renderX = this.render.canvas.width/2 + minX;
					this.renderY = this.render.canvas.height/2 + minY;
					// console.log(maxX,minX,maxY,minY);

					this.render.closePath();
					this.render.fill();
					this.render.stroke();
					this.render.restore();
				}
			}

			check(){
				var f = false;
				if(this._polygon.toString() != this.polygon.toString()){
					f = true;
					this._polygon = [...this.polygon];
				}
				if(this.render.fillStyle != this.color){
					f = true;
					this.render.fillStyle = this.color;
					this.color = this.render.fillStyle;
					this.render.strokeStyle = this.color;
				}
				return f;
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				camera.render.drawImage(this.render.canvas,this.renderX,this.renderY,this.width,this.height,-this.width*this.anchorX,-this.height*this.anchorY,this.width,this.height);
				camera.render.restore();
			}
		}

		Container = class Container extends this.GameObject{
			constructor(room,x,y,obj){
				super(room,x,y);
				this.type = 'container';
				this.data = [];

				this.__proto__.add = function(obj){
					if(this.data.indexOf(obj) == -1){
						var i = obj.parent.data.indexOf(obj);
						obj.parent.data.splice(i,1);
						obj.x -= this.x;
						obj.y -= this.y;
						obj.parent = this;
						obj.parent.data.push(obj);
					}
					return obj;					
				}
				this.__proto__.remove = function(obj){
					var i = this.data.indexOf(obj);
					if(i >= 0){
						this.data.splice(i,1);
						obj.x += this.x;
						obj.y += this.y;
						obj.parent = this.parent;
						obj.parent.data.push(obj);
					}
				}
				for(var i in obj){
					this.add(obj[i]);
				}
			}

			update(){
				for(var i in this.data){
					if(this.data[i].update)this.data[i].update();
				}
			}

			rendering(camera){
				camera.render.save();
				this.room.lights.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				this.room.lights.render.translate(this.x-camera.x,this.y-camera.y);
				this.room.lights.render.scale(this.scaleX,this.scaleY);
				this.room.lights.render.rotate(this.rotate*Math.PI/180);
				camera.render.translate(camera.x,camera.y);
				this.room.lights.render.translate(camera.x,camera.y);
				for(var i in this.data){
					if(this.data[i].rendering && this.data[i].visible)this.data[i].rendering(camera);
				}
				this.room.lights.render.restore();
				camera.render.restore();
			}
		}

		Group = class Group extends this.GameObject{
			constructor(room,x,y,target,max){
				super(room,x,y);
				this.type = 'group';
				this.data = [];
				this.maxCount = max;
				this.count = 0;
				this.target = null;

				this.__proto__.setTarget = function(obj){
					if(obj.parent){
						this.target = Object.assign({}, obj);
						this.target.__proto__ = obj.__proto__;
						this.target.parent = this;
					}
				}
				this.__proto__.getTarget = function(){
					return this.target;
				}
				this.__proto__.create = function(x=0,y=0){
					if(this.target){
						if(this.count < this.maxCount){
							var obj = Object.assign({}, this.target);
							obj.__proto__ = this.target.__proto__;
							obj.x = x;
							obj.y = y;
							this.data.push(obj);
							this.check();
							return obj;
						}
					}else console.warn("target","缺失");
				}

				this.setTarget(target);
			}

			check(){
				this.count = this.data.length;
			}

			update(){
				for(var i in this.data){
					if(this.data[i].update)this.data[i].update();
				}
			}

			rendering(camera){
				for(var i in this.data){
					if(this.data[i].rendering && this.data[i].visible)this.data[i].rendering(camera);
				}
			}
		}

		Tilemap = class Tilemap extends this.GameObject{
			constructor(room,x,y,key){
				super(room,x,y);
				const src = room.load.data[key];
				if(src && src.camplete && src.type == 'tilemap'){
					this.type = src.type;
					this.width = src.data.width;
					this.height = src.data.height;
					this.tileheight = src.data.tileheight;
					this.tilewidth = src.data.tilewidth;
					this.render = room.game.render.create(this.width*this.tilewidth,this.height*this.tileheight);
					this.layers = src.data.layers;
					this.tilesets = src.data.tilesets;
					(function(tilesets,renders){
						for(var i in tilesets){
							tilesets[i].data = {};
							var j = 0;
							while(j < tilesets[i].tilecount){
								var render = renders.create(tilesets[i].tilewidth,tilesets[i].tileheight);
								var y = (j / tilesets[i].columns | 0) * tilesets[i].tileheight;
								var x = j % tilesets[i].columns * tilesets[i].tilewidth;
								render.save();
								render.drawImage(tilesets[i].image,x,y,tilesets[i].tilewidth,tilesets[i].tileheight,0,0,tilesets[i].tilewidth,tilesets[i].tileheight);
								render.restore();
								tilesets[i].data[tilesets[i].firstgid+j] = render.canvas;
								j++;
							}
						}
					})(this.tilesets,this.room.game.render);
					this.renderer = true;
					
					this.infinite = src.data.infinite;
					this.orientation = src.data.orientation;
					this.renderorder = src.data.renderorder;
					this.tiledversion = src.data.tiledversion;
				}else console.error("键",key," 资源错误");

				this.__proto__.getTile = function(index){
					if(typeof index == 'number'){
						index = index | 0;
						for(var i in this.tilesets){
							var firstgid = this.tilesets[i].firstgid;
							if(index >= firstgid && index < firstgid + this.tilesets[i].tilecount){
								return this.tilesets[i].data[index];
							}
							return null;
						}
					}
				}
				this.__proto__.createLayer = function(name=''){
					name = name.toString();
					for(var i in this.layers){
						if(this.layers[i].name == name){
							console.log('name已存在');
							return null;
						}
					}
					var data = {
						data:Array.apply(null,{length:this.width*this.height}).map(function(){return 0}),
						height:this.height,
						id:this.layers[this.layers.length-1].id+1,
						name:name,
						opacity:1,
						type:'tilelayer',
						visible:true,
						width:this.width,
						x:0,y:0
					};
					this.renderer = true;
					this.layers.push(data);
					return data;

				}
				this.__proto__.getTileset = function(key){
					console.warn("即将废除此方法");
					for(var i in this.tilesets){
						if(this.tilesets[i].name == key || i == key){
							return this.tilesets[i];
						}
					}
					return null;
				}
				this.__proto__.getLayer = function(key){
					console.warn("即将废除此方法");
					for(var i in this.layers){
						if(this.layers[i].name == key || i == key){
							return this.layers[i];
						}
					}
					return null;
				}
				this.__proto__.setLayerTile = function(name,index,id){
					for(var i in this.layers){
						if(this.layers[i].name == name){
							this.renderer = true;
							this.layers[i].data[index] = id;
						}
					}
				}
				this.__proto__.setSize = function(){
					console.warn('该方法不适用此GameObject ','Tilemap');
				}
			}

			update(){
				if(this.renderer){
					console.log('TilemapUpdate');
					this.render.clearRect(0,0,this.render.canvas.width,this.render.canvas.height);
					for(var i in this.layers){
						var layer = this.layers[i];
						if(!layer.visible)continue;
						this.render.save();
						this.render.translate(layer.x,layer.y);
						this.render.globalAlpha *= layer.opacity;
						for(var o in layer.data){
							var tile = this.getTile(layer.data[o]);
							if(tile){
								this.render.drawImage(tile,(o%this.width)*this.tilewidth,(o/this.width|0)*this.tileheight,this.tilewidth,this.tileheight);
							}
						}
						this.render.restore();
					}
					this.renderer = false;
				}
			}

			rendering(camera){
				camera.render.save();
				camera.render.translate(this.x-camera.x,this.y-camera.y);
				camera.render.scale(this.scaleX,this.scaleY);
				camera.render.rotate(this.rotate*Math.PI/180);
				camera.render.globalAlpha *= this.alpha;
				camera.render.drawImage(this.render.canvas,-this.render.canvas.width*this.anchorX,-this.render.canvas.height*this.anchorY);
				camera.render.restore();
			}
		}

		Light = class Light extends this.GameObject{
			constructor(room,x,y){
				super(room,x,y);
				this.type = "light";
				this.render = room.lights.render;
				this.brightness = 1;
				this.radius = 200;
				this.__proto__.setBrightness = function(brightness){
					if(typeof brightness == 'number'){
						if(brightness<0)brightness = 0;
						else if(brightness > 1)brightness = 1;
						this.brightness = brightness;
					}
				}
				this.__proto__.getBrightness = function(){
					return this.brightness;
				}
				this.__proto__.setRadius = function(radius){
					if(typeof radius == 'number'){
						if(radius >= 0){
							this.radius = radius;
						}
					}
				}
				this.__proto__.getRadius = function(){
					return this.radius;
				}
			}

			update(){
				
			}

			rendering(camera){

				this.render.save();
				// this.render.globalCompositeOperation = "lighter";
				this.render.translate(this.x-camera.x,this.y-camera.y);
				this.render.beginPath();
				this.render.arc(0,0,this.radius,0,2*Math.PI);
				this.render.closePath();
				var grd=this.render.createRadialGradient(0,0,0,0,0,this.radius);
				grd.addColorStop(0,"rgba(0,0,0,"+this.brightness+")");
				grd.addColorStop(1,"rgba(0,0,0,0)");
				this.render.fillStyle=grd;
				this.render.fill();
				this.render.restore();

				
				// camera.render.save();
				// camera.render.translate(this.x-camera.x,this.y-camera.y);
				// var grd1=camera.render.createRadialGradient(-200,100,0,-200,100,this.radius);
				// grd1.addColorStop(1,"rgba(0,0,0,"+this.brightness+")");
				// grd1.addColorStop(0,"rgba(0,0,0,0)");
				// var grd2=camera.render.createRadialGradient(300,100,0,400,100,this.radius);
				// grd2.addColorStop(1,"rgba(0,0,0,"+this.room.lights.brightness+")");
				// grd2.addColorStop(0,"rgba(0,0,0,"+this.brightness+")");
				// camera.render.fillStyle = grd2;
				// camera.render.fillRect(-camera.centerX,-camera.centerY,camera.render.canvas.width,camera.render.canvas.height);
				// camera.render.restore();
			}
		}

		Particles = class Particles extends this.GameObject{
			constructor(room,x,y,target){
				super(room,x,y);
				this.type = "particles";
				// this.target = Object.assign({}, target);
				// this.target.__proto__ = target.__proto__;
				this.render = room.game.render.create(100,100);
				this.render.save();
				this.render.translate(this.render.canvas.width/2,this.render.canvas.height/2);
				var grd=this.render.createRadialGradient(0,0,0,0,0,this.render.canvas.width/2-2);
				grd.addColorStop(0,"rgba(255,255,255,255)");
				grd.addColorStop(1,"rgba(255,255,255,0)");
				this.render.fillStyle = grd;
				this.render.arc(0,0,this.render.canvas.width/2-2,0,2*Engine.Math.PI);
				this.render.fill();
				this.render.restore();

				// this.render.save();
				// this.render.globalCompositeOperation = "source-in";
				// this.render.fillStyle = "rgba(255,200,100,0.5)";
				// this.render.fillRect(0,0,this.render.canvas.width,this.render.canvas.height);
				// this.render.restore();

				// document.body.append(this.render.canvas);

				this.data = [];
				this.state = 0;
				this.position = "absolute";//绝对	absolute	相对		relative
				this.total = 20;
				this.duration = -1;
				this.time = 0;

				this.life = 1000;
				this.lifeCycle = 0;
				this.emission = 20;
				this.emitTimes = 0;
				this.angular = 90;
				this.angularCycle = 0;

				this.startSize = 50;
				this.startSizeCycle = 0;
				this.endSize = 0;
				this.endSizeCycle = 0;
				this.startSpin = 0;
				this.startSpinCycle = 0;
				this.endSpin = 0;
				this.endSpinCycle = 0;

				this.startA  = 1;	this.startACycle = 0;
				this.startR  = 26;	this.startRCycle = 0;
				this.startG  = 77;	this.startGCycle = 0;
				this.startB  = 140;	this.startBCycle = 0;

				this.endA    = 1;	this.endACycle = 0;
				this.endR    = 26;	this.endRCycle = 0;
				this.endG    = 77;	this.endGCycle = 0;
				this.endB    = 140;	this.endBCycle = 0;

				this.mode = "gravity";
				this.gravity = {
					speed:100,
					speedCycle:0,
					width:0,
					height:0,
					x:0,y:0,
					accelRad:0,
					accelRadCycle:0,
					accelTan:0,
					accelTanCycle:0,
					emit(p){
						p.x = Engine.Math.random(-this.width,this.width);
						p.y = Engine.Math.random(-this.height,this.height);
						p.speed = Engine.Math.random(this.speed-this.speedCycle,this.speed+this.speedCycle);
						p.accelRad = Engine.Math.random(this.accelRad-this.accelRadCycle,this.accelRad+this.accelRadCycle);
						p.accelTan = Engine.Math.random(this.accelTan-this.accelTanCycle,this.accelTan+this.accelTanCycle);
						p.update = function(dt){
							if(this.life == this.Life)dt = 0;
							var nx = this.x?this.x/Math.hypot(this.x,this.y):0;
							var ny = this.y?this.y/Math.hypot(this.x,this.y):0;
							var rx = nx*this.accelRad;
							var ry = -ny*this.accelRad;
							var tx = ny * this.accelTan;
							var ty = nx * this.accelTan;
							var gx = this.parent.gravity.x;
							var gy = this.parent.gravity.y;
							var ax = rx+tx+gx;
							var ay = ry+ty+gy;
							ax *= (this.Life-this.life)/1000;
							ay *= (this.Life-this.life)/1000;
							var x = Engine.Math.cos(this.angular)*this.speed + ax;
							var y = Engine.Math.sin(this.angular)*this.speed + ay;
							x *= dt/1000;
							y *= dt/1000;
							x = (x*100|0)/100;
							y = (y*100|0)/100;
							this.x += x;
							this.y -= y;
						}
						return p;
					}
				}
				this.radius = {
					startRadius:100,
					startRadiusCycle:0,
					endRadius:0,
					accelTan:0,
					accelTanCycle:0,
					emit(p){
						p.startRadius = Engine.Math.random(this.startRadius-this.startRadiusCycle,this.startRadius+this.startRadiusCycle);
						p.endRadius = this.endRadius;
						p.accelTan = Engine.Math.random(this.accelTan-this.accelTanCycle,this.accelTan+this.accelTanCycle);
						p.x = Engine.Math.cos(p.angular)*p.startRadius;
						p.y = Engine.Math.sin(p.angular)*p.startRadius;
						p.update = function (){
							var radius = (this.startRadius-this.endRadius)*this.life/this.Life+this.endRadius;
							var angle = this.angular + this.accelTan*(this.Life - this.life)/this.Life;
							this.x = Engine.Math.cos(angle)*radius;
							this.y = -Engine.Math.sin(angle)*radius;
						}
						return p;
					}
				}
				
			}

			update(dt){
				dt = dt|0;
				if(this.state==1){
					
					if(this.duration == -1 || this.time < this.duration){
						//激活状态
						while(this.time/(1000/this.emission)>=this.emitTimes){
							this.emit();
						}
						this.time += dt;
					}else{
						//结束状态
						this.end();
					}
				}
				if(this.state 	!= 2){
					for(var i in this.data){
						if(this.data[i].life < 0){
							this.data[i].destory();
							continue;
						}
						this.data[i].size = (this.data[i].startSize-this.data[i].endSize)*this.data[i].life/this.data[i].Life+this.data[i].endSize;
						this.data[i].spin = (this.data[i].startSpin-this.data[i].endSpin)*this.data[i].life/this.data[i].Life+this.data[i].endSpin;
						this.data[i].update(dt);

						this.data[i].a = ((((this.data[i].startA-this.data[i].endA)*this.data[i].life/this.data[i].Life+this.data[i].endA)*100)|0) /100;
						this.data[i].r = ((this.data[i].startR-this.data[i].endR)*this.data[i].life/this.data[i].Life+this.data[i].endR)|0;
						this.data[i].g = ((this.data[i].startG-this.data[i].endG)*this.data[i].life/this.data[i].Life+this.data[i].endG)|0;
						this.data[i].b = ((this.data[i].startB-this.data[i].endB)*this.data[i].life/this.data[i].Life+this.data[i].endB)|0;

						if(this.data[i].life<=dt+3 && this.data[i].life > 0)this.data[i].life = 0;
						else this.data[i].life-=dt;
					}
				}
			}

			play(){
				// console.log("play");
				if(this.state != 1){
					this.state = 1;
				}
			}

			end(){
				// console.log(this.emitTimes);
				//发射器停止，子粒子不变，计时清零
				this.state = 0;
				this.time = 0;
			}

			pause(){
				//发射器、子粒子停止，计时停止
				console.log('pause');
				this.state = 2;
			}

			emit(){
				this.emitTimes++;
				if(this.data.length < this.total){
					// console.log("发射");
					var p = {
						parent:this,
						x:0,y:0,
						px:this.x,py:this.y,
						render:this.room.game.render.create(this.render.canvas.width,this.render.canvas.height),
						life:Engine.Math.random(this.life-this.lifeCycle,this.life+this.lifeCycle),
						angular:Engine.Math.random(this.angular-this.angularCycle,this.angular+this.angularCycle),
						startSize:Engine.Math.random(this.startSize-this.startSizeCycle,this.startSize+this.startSizeCycle),
						endSize:Engine.Math.random(this.endSize-this.endSizeCycle,this.endSize+this.endSizeCycle),
						startSpin:Engine.Math.random(this.startSpin-this.startSpinCycle,this.startSpin+this.startSpinCycle),
						endSpin:Engine.Math.random(this.endSpin-this.endSpinCycle,this.endSpin+this.endSpinCycle),
						startA:Engine.Math.random(this.startA-this.startACycle,this.startA+this.startACycle),
						endA:Engine.Math.random(this.endA-this.endACycle,this.endA+this.endACycle),
						startR:Engine.Math.random(this.startR-this.startRCycle,this.startR+this.startRCycle),
						endR:Engine.Math.random(this.endR-this.endRCycle,this.endR+this.endRCycle),
						startG:Engine.Math.random(this.startG-this.startGCycle,this.startG+this.startGCycle),
						endG:Engine.Math.random(this.endG-this.endGCycle,this.endG+this.endGCycle),
						startB:Engine.Math.random(this.startB-this.startBCycle,this.startB+this.startBCycle),
						endB:Engine.Math.random(this.endB-this.endBCycle,this.endB+this.endBCycle),
					};
					p.Life = p.life;
					p.size = p.startSize;
					p.spin = p.startSpin;
					p.a = p.startA;
					p.r = p.startR;
					p.g = p.startG;
					p.b = p.startB;
					p.render.drawImage(p.parent.render.canvas,0,0);
					p.render.globalCompositeOperation='source-in';
					p.rendering = function(camera){
						camera.render.save();
						if(this.parent.position == "absolute")camera.render.translate(this.px-camera.x+this.x,this.py-camera.y+this.y);
						else if(this.parent.position == "relative")camera.render.translate(this.parent.x-camera.x+this.x,this.parent.y-camera.y+this.y);
						camera.render.rotate(this.spin*Math.PI/180);
						this.render.fillStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
						// console.log(this.render.fillStyle);
						this.render.fillRect(0,0,this.render.canvas.width,this.render.canvas.height);
						camera.render.drawImage(this.render.canvas,-this.size*0.5,-this.size*0.5,this.size,this.size);
						camera.render.restore();
					}
					p.destory = function(){
						var i = this.parent.data.indexOf(this);
						if(i != -1){
							this.parent.data.splice(i,1);
						}
					}
					this.data.push(this[this.mode].emit(p));
				}
			}

			rendering(camera){
				 
				camera.render.save();
				camera.render.globalCompositeOperation="lighter";
				for(var i in this.data){
					this.data[i].rendering(camera);
				}
				camera.render.restore();
			}
		}

	}

	this.Vector = class Vector{

	}

	this.Math = new class Maths{
		constructor(){
			this.E = Math.E;
			this.LN2 = Math.LN2;
			this.LN10 = Math.LN10;
			this.LOG2E = Math.LOG2E;
			this.LOG10E = Math.LOG10E;
			this.PI = Math.PI;
			this.SQRT1_2 = Math.SQRT1_2;
			this.SQRT2 = Math.SQRT2;

			this.abs = Math.abs;
			this.acos = Math.acos;
			this.acosh = Math.acosh;
			this.asin = Math.asin;
			this.asinh = Math.asinh;
			this.atan = Math.atan;
			this.atan2 = Math.atan2;
			this.atanh = Math.atanh;
			this.cbrt = Math.cbrt;
			this.ceil = Math.ceil;
			this.clz32 = Math.clz32;
			this.cos = function(angle){
				return Math.cos(angle*this.PI/180);
			}
			this.cosh = Math.cosh;
			this.exp = Math.exp;
			this.expm1 = Math.expm1;
			this.floor = Math.floor;
			this.fround = Math.fround;
			this.hypot = Math.hypot;
			this.imul = Math.imul;
			this.log = Math.log;
			this.log1p = Math.log1p;
			this.log2 = Math.log2;
			this.log10 = Math.log10;
			this.max = Math.max;
			this.min = Math.min;
			this.pow = Math.pow;
			this.random = function(min,max){
				return Math.floor(Math.random() * (max - min + 1)) + min;
			}
			this.round = Math.round;
			this.sign = Math.sign;
			this.sin = function(angle){
				return Math.sin(angle*this.PI/180);
			}
			this.sinh = Math.sinh;
			this.sqrt = Math.sqrt;
			this.tan = Math.tan;
			this.tanh = Math.h;
			this.trunc = Math.trunc;
		}
	}

	this.Network = class Network{

	}

	this.Physics = class Physics{

	}

	this.Input = new class Input{
		constructor(){
			
		}
	}

	this.Loader = class Loader{
		constructor(game){
			this.game = game;
			this.host = window.origin
			this.url = this.host;
			this.data = {};
			this.onloadCount = 0;
			this.failCount = 0;
			this.campleteCount = 0;

			this.__proto__.check = function(){
				var room = this.room.main;
				if(room.load.campleteCount + room.load.failCount == room.load.onloadCount){
					this.room.progress = "create";
					room.create();
					this.room.progress = "update";
				};

			}.bind(game);
		}

		setUrl(url){
			url = url[0]=='/'?url:'/'+url;
			url = url[url.length-1]=='/'?url.substring(0,url.length-1):url
			this.url = this.host + url;
		}

		image(key,url){
			url = this.url + (url[0]=='/'?url:'/'+url);
			if(this.data[key])console.warn(key,'资源覆盖');
			this.data[key] = {
				type:'image',
				url:url,
				camplete:false
			}
			this.onloadCount++;
		}

		sprite(key,url,width=16,height=16){
			url = this.url + (url[0]=='/'?url:'/'+url);
			if(this.data[key])console.warn(key,'资源覆盖');
			this.data[key] = {
				type:'sprite',
				url:url,
				width:width,
				height:height,
				camplete:false
			}
			this.onloadCount++;
		}

		json(key,url){
			url = this.url + (url[0]=='/'?url:'/'+url);
			if(this.data[key])console.warn(key,'资源覆盖');
			this.data[key] = {
				type:'json',
				url:url,
				camplete:false
			}
			this.onloadCount++;
		}

		tilemap(key,url){
			url = this.url + (url[0]=='/'?url:'/'+url);
			if(this.data[key])console.warn(key,'资源覆盖');
			this.data[key] = {
				type:'tilemap',
				url:url,
				camplete:false
			}
			this.onloadCount++;
		}

		audio(key,url){
			url = this.url + (url[0]=='/'?url:'/'+url);
			if(this.data[key])console.warn(key,'资源覆盖');
			this.data[key] = {
				type:'audio',
				url:url,
				camplete:false
			}
			this.onloadCount++;
		}

		html(key,url){
			url = this.url + (url[0]=='/'?url:'/'+url);
			if(this.data[key])console.warn(key,'资源覆盖');
			this.data[key] = {
				type:'html',
				url:url,
				camplete:false
			}
			this.onloadCount++;
		}

		file(key,url){
		    url = this.url + (url[0]=='/'?url:'/'+url);
		    if(this.data[key])console.warn(key,'资源覆盖');
			this.data[key] = {
				type:'file',
				url:url,
				camplete:false
			}
			this.onloadCount++;
		}

		onload(){
			var data = this.data;
			var that = this;
			for(var i in data){
				var src;
				switch(data[i].type){
					case 'image':
					case 'sprite':
						src = new Image();
						src.onload = function(e){
							this.camplete = true;
							this.data = e.path[0];
							that.campleteCount++;
							that.onprogress(that.campleteCount,that.onloadCount,this.url,e.timeStamp|0);
							that.check();
						}.bind(data[i]);
						src.onerror = function(e){
							that.failCount++;
							that.check();
						}
						src.src = data[i].url;
					break;

					case 'audio':
						src = new Audio();
						src.src = data[i].url;
						src.oncanplay = function(e){
							this.camplete = true;
							this.data = e.path[0];
							that.campleteCount++;
							that.onprogress(that.campleteCount,that.onloadCount,this.url,e.timeStamp|0);
							that.check();
						}.bind(data[i]);
						src.onerror = function(e){
							that.failCount++;
							that.check();
						}
					break;
					case 'tilemap':
						var xmlHttp = new XMLHttpRequest();
						xmlHttp.open("GET",data[i].url,true);
						xmlHttp.send(); 
						xmlHttp.onloadend = function(e){
							if(xmlHttp.status == 200){
								
								this.data = JSON.parse(e.target.responseText);
								(function(tile){
									for(var i in tile){
										var url = tile[i].image;
										var head = e.target.responseURL.split('/');
										head.pop();
										while(url.indexOf('..') != -1){
											url = url.replace('../','');
											head.pop();
										}
										head = head.join('/');
										url = head + '/' + url;
										tile[i].image = new Image();
										tile[i].image.onerror = function(e){
											console.warn('tilesets资源',this.src,'丢失');
										}
										tile[i].image.src = url;
									}
								})(this.data.tilesets);

								this.camplete = true;
								that.campleteCount++;
								that.onprogress(that.campleteCount,that.onloadCount,this.url,e.timeStamp|0);
							}else{
								that.failCount++;
							}
							that.check();
						}.bind(data[i]);
					break;
					default:
						var xmlHttp = new XMLHttpRequest();
						xmlHttp.open("GET",data[i].url,true);
						xmlHttp.send(); 
						xmlHttp.onloadend = function(e){
							if(xmlHttp.status == 200){
								this.camplete = true;
								this.data = function(json){
									try{
										return JSON.parse(json);
									}catch(e){
										return json;
									}
								}(e.target.responseText);
								that.campleteCount++;
								that.onprogress(that.campleteCount,that.onloadCount,this.url,e.timeStamp|0);
							}else{
								that.failCount++;
							}
							that.check();
						}.bind(data[i]);
					break;
				}

			}
		    
		}

		onprogress(i,j,url,ms){
			
		}


		clear(){
			this.url = this.host;
			this.onprogress = function(){};
			this.onloadCount = 0;
			this.campleteCount = 0;
			this.data = {};
		}
	}

	this.Plugin = class Plugin{

	}

	this.Render = class Render{

	}

	this.System = new class System{
		WIDTH	= window.innerWidth;
		HEIGHT	= window.innerHeight;
		BACK 	= false;
	}

	this.Time = class Time{

	}

	this.Animation = class Animation{

	}

}