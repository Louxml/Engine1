# Engine1
 
## 模仿Phaser写的一个2D游戏框架，采用Phaser的架构，完成子系统：

## Room系统
  通过房间去存储、渲染游戏对象
## GameObject子系统
### GameObject 基类
### Image
继承GameObject 渲染图片
### Sprite
继承GameObject 渲染精灵图集
### Text
继承GameObject 渲染文字
### Audio
继承GameObject 声音系统
### Camera
继承GameObject 绘制游戏物体，转化transform
### Rectangle
继承GameObject 渲染矩形
### Circle
继承GameObject 渲染圆
### Arc
继承GameObject 渲染弧
### Polygon
继承GameObject 渲染多边形
### Container
继承GameObject 渲染组合体
### Group
继承GameObject 对象池
### TileMap
继承GameObject 渲染TileMap,实现基本的绘制
### Light 光影系统（待学习）
继承GameObject 渲染光影特效,实现基本的点光源，其他光源待实现
### Particles 粒子系统
继承GameObject 渲染粒子，目前实现百级粒子，保持60FPS(但有波动，不稳定)，待优化
采用离屏渲染优化粒子渲染
## Loader子系统
资源加载系统

### Demo测试
[Demo](http://112.74.35.246/demo8)
