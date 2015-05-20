jQuery(function($) {
	"use strict";
	//socket.ioのサーバにに接続
	var canvas = document.getElementById('igoban');
	/* canvas要素のノードオブジェクト */
	/* canvas要素の存在チェックとCanvas未対応ブラウザの対処 */
	if ( ! canvas || ! canvas.getContext ) {
	   return false;
	}
	
	/* 2Dコンテキスト */
	var ctx = canvas.getContext('2d');

	var player_id = -1;
	var kihu = {};
	var player_order = "";

	var mouseX = 0;
	var mouseY = 0;

  	var offset = 24;
  	var radius = 24;

	var ch = 480;
	var cw = 480;

	var active_player = false;

	draw();

	var socket = io.connect('http://'+location.host+'/');
	
	//サーバからmessageイベントが送信された時
	socket.on('message',function(data){
		$('#list').prepend($('<div/>').text(data.text));
	});

	//サーバからmessageイベントが送信された時
	socket.on('set_player_id',function(data){
		$('#player_id').prepend($('<div/>').text(data.text));
		player_id = data.text;
	});

	//サーバから set_player_order イベントが送信された時。手番がどれかを示す。
	socket.on('set_player_order',function(data){
		$('#player_order').prepend($('<div/>').text(data.text));
		player_order = data.text;
	});

	//サーバから set_player_order イベントが送信された時。手番がどれかを示す。
	socket.on('update',function(data){
		kihu = data.kihu;
		$('#kihu').replaceWith($('<div id="kihu"/>').text(JSON.stringify( kihu )));
		draw();
	});

	// 自分がアクティブプレイヤーかどうかを変更する
	socket.on('set_active_player',function(data){
		if ( data.text == "true"){
			active_player = true;
		}else{
			active_player = false;
		}
		draw();
	});

	//sendボタンがクリックされた時
	$('#send').click(function(){
		var text = $('#input').val();
		if(text !== ''){
			//サーバにテキストを送信
			socket.emit('message',{text:text});
			$('#list').prepend($('<div/>').text(text));
			$('#input').val('');
		}
	});

	canvas.onmousemove = mouseMoveListner;
	function mouseMoveListner(e) {
		//座標調整
		adjustXY(e);
		draw();
	}

	canvas.onmouseover = mouseOverListner;
	function mouseOverListner(e) {
		//座標調整
		mouseX = 0;
		mouseY = 0;
		draw();
	}

	// 盤面上をクリックしたら、その情報をサーバに送信する。
	canvas.onmouseup = mouseUpListner;
	function mouseUpListner(e) {
		//座標調整
		var pos = '';
		var x, y;
		adjustXY(e);
		x = Math.floor((mouseX-(offset-radius/2))/radius) + 1;
	    y = Math.floor((mouseY-(offset-radius/2))/radius) + 1;

	    if (!( x < 1 || x > 19 || y < 1 || y > 19 ) ){
		    pos = x + ',' + y;

		    socket.emit('set_stone',{pos: pos});
		}
	}

	function adjustXY(e) {
		var rect = e.target.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}

	// 碁盤を表示する
	function draw() {

	  /* 碁盤 */
	  ctx.fillStyle = '#c09070'; // グレー
	  ctx.fillRect(0,0,480,480);


	  var x = 0, y = 0;
	  while (x < 19){
	 	ctx.beginPath();
		ctx.moveTo(offset,           x*radius + offset);
		ctx.lineTo(offset+ 18*radius,x*radius + offset);
	    ctx.closePath();
	    ctx.stroke();

	    ctx.beginPath();
		ctx.moveTo(offset + x*radius,          offset);
		ctx.lineTo(offset + x*radius,18*radius+offset);
	    ctx.closePath();
	    ctx.stroke();
	    x++;
	  }

  		ctx.fillStyle = '#000000'; // 黒

	// 星を表示する
	  x = 3;
	  while( x < 19 ){
	  	y = 3;
	  	while ( y < 19 ){
	  		ctx.fillRect( offset + x * radius - 4, offset + y * radius - 4, 8, 8 );
	  		y += 6;
	  	}
 		x += 6;
	  }

	  // 棋譜の表示
	  x = 1;
	  while( x < 20 ){
	  	y = 1;
	  	while ( y < 20){
	  		var str = x + ',' + y;
	  		if ( kihu[str] != null ){
	  			if ( kihu[str].color == "white"){
	  				ctx.strokeStyle = "#000000";
	  				ctx.fillStyle = "#FFFFFF";
	  				ctx.beginPath();
//	  				ctx.strokeRect( (x-1)*radius + 4 + offset-radius/2, 4 + (y-1)*radius + offset-radius/2,
//	  				 radius - 8, radius - 8);
					ctx.arc( (x-1)*radius + offset, (y-1)*radius + offset,
	  				 radius/2 - 1, Math.PI*2, false );
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
	  			}else{
	  				ctx.fillStyle = "#000000";
	  				ctx.beginPath();
//	  				ctx.fillRect( (x-1)*radius + 4 + offset-radius/2, 4 + (y-1)*radius + offset-radius/2,
//	  				 radius - 8, radius - 8);
					ctx.arc( (x-1)*radius + offset, (y-1)*radius + offset,
	  				 radius/2 - 1, Math.PI*2, false );
					ctx.closePath();
					ctx.fill();
	  			}
	  		}
	  		y++;
	  	}
	  	x++;
	  }


	// マウスで触ったマスを表示する。
	  x = Math.floor((mouseX-(offset-radius/2))/radius);
	  y = Math.floor((mouseY-(offset-radius/2))/radius);

	  if (!( x < 0 || x > 18 || y < 0 || y > 18 ) ){
	  	if ( active_player ){
	    	ctx.strokeStyle = "#ff0000";
		}else{
			ctx.strokeStyle = "#0000ff";
		}

	  	ctx.strokeRect( x*radius + offset-radius/2, y*radius + offset-radius/2, radius, radius );

	   $('#pos').replaceWith($('<div id="pos"/>').text((x+1) + ',' + (y+1)));
	  }
	  ctx.strokeStyle = "#000000";

	}
});

