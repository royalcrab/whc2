
"use strict";
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')


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

var going = false; // ゲームが進行している状態を示す。停止、終了、開始前のときは false

var players = 0; // ユニークな番号にすることにする
var playersSockets = {};
var activeSocket = {};
var activePlayer = null;
var log = {};
var counter = 0;
var maxPlayer = 2;

//クライアントから接続があった時
io.sockets.on('connection',function(socket){

  console.log("connected");

  socket.on('start_connect',function(data){
    console.log( "connect" + data.text );

    if ( players < maxPlayer ){
      if ( playersSockets[0] == null ){
        playersSockets[0] = socket;
      }else{
        playersSockets[1] = socket;
      }
      players++;
      console.log( players );

      if ( players >= maxPlayer ){
        playersSockets[0].json.emit('start_game',{text: "first",
          status: {
            planets: {},
            hands: {},
            warlord: {image: "tn_WHK01_1.jpg",name: "Captain Cato Sicarius"}
          }});
        playersSockets[1].json.emit('start_game',{text: "second",
          status: {
            planet: {},
            hand: {},
            warlord: {image: "tn_WHK01_3.jpg",name: "Nazdreg"}
          }});
        going = true; // ゲーム開始
      }
    }else{
      socket.json.emit('start_game', {text: "observer"});
      // すでにゲーム開始している状態で、observer として追加する
    }
    
  });

	//チャットコマンド(デバッグ用)
  socket.on('message',function(data){
		//念のためdataの値が正しいかチェック
		if(data && typeof data.text === 'string'){
			//メッセージを投げたクライアント以外全てのクライアントにメッセージを送信する。
      console.log(data.text);

      socket.broadcast.json.emit('message',{text:data.text});
		}
	});

  // クライアントが切断したときの処理をかく
  // 実際問題として disconnect しても通知があるわけではないから、ここは window 閉じたときとかしか呼ばれない
  // あとで別の処理をかく。
  socket.on('disconnected', function(data) {
    console.log("player disconected. ");
    // 0,1 のプレイヤーが切れたら game をストールさせて復活をまつ。
    if ( playerSockets[0] == socket){
      socket.broadcast.json.emit('pause',{text: "0"}); // 0 プレイヤーが切断
      playerSockets[0] = null;
      players --;
      going = false;
    }else if ( playerSockets[1] == socket){
      socket.broadcast.json.emit('pause',{text: "1"}); // 1 プレイヤーが切断
      playerSockets[1] = null;
      players --;
      going = false;
    }else {
      // 観戦者が切断した場合はとくになにもしない。
    }
  });
  
});

