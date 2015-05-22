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

	var mouseX = 0;
	var mouseY = 0;

	var ch = 100;
	var cw = 100;

	var socket = io.connect('http://'+location.host+'/');

	draw();

	// 明示的に接続する。ここにユーザネームとかを入れたい。
	//socket.emit('connect',{text:''});
	
	// starg_game を受けたとき
	socket.on('start_game',function(data){
		$('#player_order').replaceWith($('<div id="player_order"/>').text(data.text));

//		$('#hq2').replaceWith($('<div id="hq2"/>').text('<img src="http://localhost/kani/images/'
//			+ data.status.warlord.image
//			+ '" width="57"/><br/>'
//			+ data.status.warlord.name
		$('img#hq2i').attr('src','http://localhost/kani/images/' + data.status.warlord.image );
		$('#hq2').replaceWith($('<div id="hq2"/>').text(data.status.warlord.name));

	});

	//サーバからmessageイベントが送信された時
	socket.on('message',function(data){
		$('#list').prepend($('<div/>').text(data.text));
	});

	//sendボタンがクリックされた時
	$('#send_name').click(function(){
		var text = $('#name').val();
		if(text !== ''){
			//サーバにテキストを送信
			socket.emit('start_connect',{text:text});
			$('#list').prepend($('<div/>').text(text));
			$('#input').val('');
		}
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
	}

	function adjustXY(e) {
		var rect = e.target.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}

	// canvas を描画するソースを残してあるだけ
	function draw() {

	  /* 碁盤 */
	  ctx.fillStyle = '#c09070'; // グレー
	  ctx.fillRect(0,0,cw,ch);
	}

});

