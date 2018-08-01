'use strict';

// 无向图
class Graph {
    constructor(count) {
        //this.count = count;          // 记录顶点的个数
        this.edges = 0;                 // 记录边的条数
        this.adj = [];    // 邻接表
        this.visited = [];// 访问状态表
        this.dfsArr = [];               // dfs遍历结果存储
        this.bfsArr = [];               // bfs遍历结果存储
        this.edgeTo = [];               // 记录一个顶点到下一个顶点的边

        this.depths = 0;
        this.paths = []; //存储节点A到节点B的所有路径
        this.pathsArr = []; //获取两点间路径时的遍历结果存储
        //this.init();       // 初始化操作
    }
    
    // 初始化未访问数组
    initVisited() {
        for (let key in this.adj) {
            this.visited[key] = false;
        }
    }
    // 清空dfs结果
    initDfsArr() {
        this.dfsArr = [];
    }
    // 清空bfs结果
    initBfsArr() {
        this.bfsArr = []
    }
    // 清空 edgeTo
    initEdgeTo() {
        this.edgeTo = [];
    }
    // 向图中增加顶点
    addEdge(v, w) {
        this.adj[v] = this.adj[v] || [];
        this.adj[w] = this.adj[w] || [];

        this.adj[v].push(w);
        this.adj[w].push(v);
        this.edges++;
    }

    //判断是不是存在一个边从节点v到w
    hasEdge(v,w){
       return this.adj[v].indexOf(w) != -1;
    }

    // 打印邻接表
    showGraph() {
        let str = '';
        for (let key in this.adj) {
            str += (key + " -> ");

            for (let j = 0, len = this.adj[key].length; j < len; j++) {
                if (this.adj[key][j] != undefined) {
                    str += (this.adj[key][j] + ' ');
                }
            }
            str += "\n";
        }
        return str;
    }

    // 调用dfs
    initDfs(v) {
        this.initVisited();
        this.initDfsArr();
        this.dfs(v);
    }

    // 调用allPathsTo
    initPathsTo(v,to) {
        this.initVisited();
        this.initDfsArr();
        this.allPathsTo(v,to);
    }

    // 调用bfs
    initBfs(v) {
        this.initVisited();
        this.initBfsArr();
        this.initEdgeTo();
        this.bfs(v);
    }

    // 深度优先遍历 
    dfs(v) {
        // 置空结果
        // 当前访问点设置已访问
        this.visited[v] = true;
        if (this.adj[v] != undefined) {
            //console.log("visited " + v);
            // 加入结果数组
            this.dfsArr.push(v);
        }
        for (let w of this.adj[v]) {
            // 邻接点未访问继续dfs
            if (!this.visited[w]) {
                this.dfs(w);
            }
        }
    }
 
    //列举节点v到节点to的所有路径
    allPathsTo(v,to,init = true) {
        init && (this.depths = 0);
        this.depths++;
        if (this.adj[v] != undefined) {
            // 加入结果数组
            this.pathsArr.push(v);
        }

        for(let i = 0; i < this.adj[v].length; i++){
            let w = this.adj[v][i];
            if(w == to){
                let copyArr = [].concat(this.pathsArr);
                copyArr.push(to);
                this.paths.push(copyArr);
            }

            if ( w != to  //找到目标节点后结束寻找
                && (this.pathsArr.indexOf(w) == -1 )) { //防止生成回路
                    if(this.depths < 2){
                        this.allPathsTo(w,to,false);
                    }
            }

            if(i == this.adj[v].length -1){ //如果子节点遍历完，回退到上一节点
                this.pathsArr.pop();
            }
        }
    }

    // 广度优先遍历
    bfs(start) {
        // 开一个队列
        const que = [];
        // 将当前点设置已经访问
        this.visited[start] = true;
        // 将起点加入队列
        que.push(start);
        // 如果队列中一直有值
        while (que.length > 0) {
            // 每次出队一个顶点 
            let v = que.shift();
            // 如果存在点 则表示遍历了该点，则加入结果数组中
            if (v != undefined) {
                //console.log("visited " + v);
                this.bfsArr.push(v);
            }
            // 遍历当前访问的顶点的所有相邻顶点
            for (let w of this.adj[v]) {
                // 如果相邻的顶点未访问，则加入队列中，并设置访问状态
                if (!this.visited[w]) {
                    this.visited[w] = true;
                    // 表示从 w -> v 存在一条路径
                    this.edgeTo[w] = v;
                    // console.log(w + " -> " + v);
                    que.push(w);
                }
            }
        }
    }

    // 显示不同的点的路径
    pathTo(start, v) {
        let source = start;
        if (!this.hasPathTo(v)) {
            return undefined;
        }
        const path = [];
        for (let i = v; i != source; i = this.edgeTo[i]) {
            path.push(i);
        }
        path.push(source);
        return path.reverse();
    }

    // 判断某个点是否访问过
    hasPathTo(v) {
        return this.visited[v];
    }
}

module.exports = Graph;


// const g = new Graph();
// g.addEdge(0, 1);
// g.addEdge(0, 2);
// g.addEdge(1, 3);
// g.addEdge(2, 3);
// g.addEdge(1, 4);
// g.addEdge(3, 4);
// console.log(g.adj);


// console.log("---------------------------------------------- show graph");
// let str = g.showGraph();
// console.log(str);
// console.log(g.visited);

// console.log("---------------------------------------------- show all paths");
// g.initPathsTo(0, 2);
// //g.initDfs(0, 4);
// console.log("pathsArr:" + JSON.stringify(g.pathsArr));
// console.log("paths:" + JSON.stringify(g.paths));

// console.log("---------------------------------------------- DFS");
// g.initDfs(0, 4);
// console.log(g.dfsArr);

// console.log("---------------------------------------------- DFS");
// g.initDfs(4);
// console.log(g.dfsArr);


// console.log("---------------------------------------------- BFS");
// g.initBfs(0);
// console.log(g.bfsArr);
// console.log(g.edgeTo);
// console.log("---------------------------------------------- BFS end");

// //g.initBfs(4);
// //console.log(g.bfsArr);
// let arr = g.pathTo(1, 3);
// console.log(arr);