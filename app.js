
"use strict";
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//socket.ioのインスタンス作成
var io = require('socket.io').listen(server);

var players = 0; // ユニークな番号にすることにする
var allPlayers = {};
var activeSocket = {};
var activePlayer = null;
var kihu = {};
var log = {};
var counter = 0;

//クライアントから接続があった時
io.sockets.on('connection',function(socket){
  var observer_mode = false;

  // 接続が切れても自動的にもとにもどる。ただし、戻るときの順序みたいなものは保存されない。何か制御が必要
  players ++;

  // クライアントに ID を振る
  allPlayers[socket.id] = players;
  socket.json.emit('set_player_id',{text: players});

  console.log("player id:" + players );

  // さきにつないだ2人をプレイヤーとする。
  if ( activeSocket[0] == null ){
    activeSocket[0] = socket;
    socket.json.emit('set_player_order',{text: "black"});
  }else if ( activeSocket[1] == null ){
    activeSocket[1] = socket;
    socket.json.emit('set_player_order',{text: "white"});

    // 1手目を打てるようにする
    activePlayer = {socketid: activeSocket[0].id, color:"black"};
    activeSocket[0].json.emit( "set_active_player", {text: "true"} );
    activeSocket[1].json.emit( "set_active_player", {text: "false"} );

  }else { // 3 人目以降は観戦者とする
    // クライアントごとに observer_mode は独立してメモリされている模様
    observer_mode = true;
    socket.json.emit('set_player_order',{text: "observer"});
    console.log( "player id:" + players);
  }

  // どこかに石をおいた: data は {x: posx, y: posy, pid: player_id} とする
  // 交互にうたせる制御をここでしている。とてもスマートとはいえないな。
  socket.on('set_stone',function(data){
    console.log( "pos:" + data.pos );
    if ( socket.id == activePlayer.socketid ){
      console.log( "active!!: " + activePlayer.color );

      // 棋譜を記録し、各クライアントに送る
      if ( kihu[data.pos] == null || kihu[data.pos] == '' ){
        kihu[data.pos] = {color: activePlayer.color, number: counter };
        log[counter] = ( {color: activePlayer.color, pos: data.pos } );

        counter ++;

        socket.broadcast.json.emit("update", {kihu: kihu});

        socket.json.emit("update", {kihu: kihu});

        console.log( kihu );

        // アクティブプレイヤーを変更する
        if ( activePlayer.color == "black"){
          activePlayer = {socketid: activeSocket[1].id, color:"white"};
          activeSocket[1].json.emit( "set_active_player", {text: "true"} );        
          activeSocket[0].json.emit( "set_active_player", {text: "false"} ); 
        }else{
          activePlayer = {socketid: activeSocket[0].id, color:"black"};
          activeSocket[0].json.emit( "set_active_player", {text: "true"} );        
          activeSocket[1].json.emit( "set_active_player", {text: "false"} );
        }
      }

    }
  });

	//クライアントからmessageイベントが受信した時
  socket.on('message',function(data){
		//念のためdataの値が正しいかチェック
		if(data && typeof data.text === 'string'){
			//メッセージを投げたクライアント以外全てのクライアントにメッセージを送信する。
      socket.broadcast.json.emit('message',{text:data.text});
		}
	});

  // クライアントが切断したときの処理をかく
  socket.on('disconnect', function(data) {
    console.log("player disconected:" + allPlayers[socket.id] );
  });
  
});

