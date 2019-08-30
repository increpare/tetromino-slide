
var canvas = document.getElementById('game');
	// get canvas context
var ctx = canvas.getContext('2d');
// load image

var sprache=0;

var cw=canvas.width;
var ch=canvas.height;

function reOffset(){
  var BB=canvas.getBoundingClientRect();
  offsetX=BB.left;
  offsetY=BB.top;        

	cw=canvas.width;
	ch=canvas.height;
}
var offsetX,offsetY;
reOffset();
window["onscroll"]=function(e){ reOffset(); }
window["onresize"]=function(e){ reOffset(); }

var score=0;
var highscore=0;

var images=[];

var gw=4;
var gh=4;

var phase;
var anim_frames=5;
var anim_length=30;

var anim_phase;//goes to 10 say
var anim;
var spawn;

var gameover;

var last=1;
var laster=-1;


var raster_b=10;
var raster_h=22;
var verborgene_zeilen=4;

var zustand=[];
var anims=[];

function holZufälligeIntInklusi(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min +1)) + min; 
}

var tetrominos = [
	//tetris
	[
		[
			[ 1, 1, 1, 1, ],
		],
		[
			[ 1 ], 
			[ 1 ], 
			[ 1 ],
			[ 1 ], 			
		],
	],
	// J-piece
	[
		[
			[ 1, 0, 0, ],
			[ 1, 1, 1, ],
		],
		[
			[ 1, 1, ],
			[ 1, 0, ],
			[ 1, 0, ],
		],
		[
			[ 1, 1, 1, ],
			[ 0, 0, 1, ],
		],
		[
			[ 0, 1, ],
			[ 0, 1,  ],
			[ 1, 1,  ],
		],
	],
	// L-piece
	[
		[
			[ 0, 0, 1, ],
			[ 1, 1, 1, ],
		],
		[
			[ 1, 0, ],
			[ 1, 0, ],
			[ 1, 1, ],
		],
		[
			[ 1, 1, 1, ],
			[ 1, 0, 0, ],
		],
		[
			[ 1, 1,  ],
			[ 0, 1,  ],
			[ 0, 1,  ],
		],
	],
	// O-piece
	[
		[
			[ 1, 1, ],
			[ 1, 1, ],
		],
	],
	// S-piece
	[
		[
			[ 0, 1, 1, ],
			[ 1, 1, 0, ],
		],
		[
			[ 1, 0, ],
			[ 1, 1, ],
			[ 0, 1, ],
		],
		[
			[ 0, 1, 1, ],
			[ 1, 1, 0, ],
		],
		[
			[ 1, 0,  ],
			[ 1, 1,  ],
			[ 0, 1,  ],
		],
	],
	// T-Piece
	[
		[
			[ 1, 1, 1, ],
			[ 0, 1, 0, ],
		],
		[
			[ 0, 1, 0, ],
			[ 1, 1, 1, ],
		],
		
		[
			[ 0, 1, ],
			[ 1, 1, ],
			[ 0, 1, ],
		],
		
		[
			[ 1, 0, ],
			[ 1, 1, ],
			[ 1, 0, ],
		],

	],
	// Z-stück
	[
		[
			[ 1, 1, 0, ],
			[ 0, 1, 1, ],
		],
		[
			[ 0, 1, ],
			[ 1, 1, ],
			[ 1, 0, ],
		],
		[
			[ 1, 1, 0, ],
			[ 0, 1, 1, ],
		],
		[
			[ 0, 1,  ],
			[ 1, 1,  ],
			[ 1, 0,  ],
		],
	],
]

var lookupdat=[
	[4,0],//0000
	[1,0],//0001
	[3,0],//0010
	[2,0],//0011
	[0,0],//0100
	[3,1],//0101*
	[4,1],//0110*
	[6,0],//0111
	[0,2],//1000
	[3,2],//1001*
	[4,2],//1010*
	[5,1],//1011
	[0,1],//1100
	[5,0],//1101
	[6,1],//1110
	[5,2],//1111

]

function binstr(d){
	var ts=d.toString(2);
	while(ts.length<4){
		ts="0"+ts;
	}
	return ts;//.split("").reverse().join("");
}
function lookup(figuretyp,datum){
	datum=(datum>>1)%16;
	var ts=binstr(datum);
	var tx=-1;
	var ty=-1;
	var lud=lookupdat[datum]
	tx=lud[0];
	ty=lud[1];
	if (figuretyp===3){
		tx-=2;
	}
	return [tx,ty];
}

function Verbindungen_Ausrechnen(raster,farbe){
	var breite=raster[0].length;
	var höhe=raster.length;
	for (var i=0;i<breite;i++){
		for (var j=0;j<höhe;j++){
			var v_oben=0;
			var v_unten=0;
			var v_links=0;
			var v_rechts=0;

			if (raster[j][i]===0){
				continue;
			}
			if (i>0&&raster[j][i-1]>0){
				v_links=1;
			}
			if (i+1<breite&&raster[j][i+1]>0){
				v_rechts=1;
			}


			if (j>0&&raster[j-1][i]>0){
				v_oben=1;
			}
			if (j+1<höhe&&raster[j+1][i]>0){
				v_unten=1;
			}

			raster[j][i]=1+2*v_rechts+4*v_links+8*v_unten+16*v_oben+32*farbe;
		}
	}
}

var verbindungen_ausgerechnet=false;

var nächst=-1;
var nächst_drehung=-1;
var tasche=[0,1,2,3,4,5,6];

function darfPlatzieren(stück,x,y){

	var nächst_z_h=stück.length;
	var nächst_z_b=stück[0].length;
	for (var i=0;i<nächst_z_b;i++){
		var globale_x=x+i;
		for (var j=0;j<nächst_z_h;j++){
			var globale_y=y+j;

			if (globale_x>=raster_b || globale_y>=raster_h){
				return false;
			}

			if (stück[j][i]>0 && zustand[globale_y][globale_x]>0){
				return false;
			}
		}
	}
	return true;
}
function projizieren(){	
	var stück=tetrominos[nächst][nächst_drehung];
	var nächst_z_h=stück.length;
	var nächst_z_b=stück[0].length;

	var ox=15;
	var oy=29-4*8;

	var sx=5-Math.ceil(nächst_z_b/2);
	var sy=0;

	var px=sx;
	var py=0;

	while (darfPlatzieren(stück,px,py+1)){
		py++;
	}

	for (var i=0;i<nächst_z_b;i++){
		var globale_z_x=ox+8*px+8*i;
		for (var j=0;j<nächst_z_h;j++){
			if (py+j<2){

			}
			if (stück[j][i]>0){
				var globale_z_y=oy+8*py+8*j;
				var lu = lookup(nächst,stück[j][i]);
				var tx=lu[0]*8;
				var ty=lu[1]*8;	
				ctx.drawImage(images["template_umriss"],tx,ty,8,8,globale_z_x,globale_z_y,8,8);
			}
		}
	}


}

async function resetGame(){

	moving=true;

	tasche=[0,1,2,3,4,5,6];

	nächst_index=holZufälligeIntInklusi(0,tasche.length-1);
	nächst=tasche[nächst_index];
	tasche.splice(nächst_index,1);

	nächst_drehung=holZufälligeIntInklusi(0,tetrominos[nächst].length-1)
	
	playSound(90509500);
	gameover=false;
	zustand=[];
	for (var j=0;j<raster_h;j++){
		var zeile=[];
		var zeile_anim=[];
		for (var i=0;i<raster_b;i++){
			zeile.push(0);
			zeile_anim.push(0);
		}
		zustand.push(zeile);
		anims.push(zeile_anim);
	}
	if (verbindungen_ausgerechnet===false){
		for (var i=0;i<tetrominos.length;i++){
			var menge=tetrominos[i];
			for (var j=0;j<menge.length;j++){
				Verbindungen_Ausrechnen(menge[j],i);
			}
		}
		verbindungen_ausgerechnet=true;
	}

	anim=[//comesfrom
	[[0,0],[0,0],[0,0],[0,0],[0,0]],
	[[0,0],[0,0],[0,0],[0,0],[0,0]],
	[[0,0],[0,0],[0,0],[0,0],[0,0]],
	[[0,0],[0,0],[0,0],[0,0],[0,0]],
	[[0,0],[0,0],[0,0],[0,0],[0,0]]];
	state=[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]];
	spawn=[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]];
	anim_phase=0;
	phase=0;
	score=0;

	// spawnRand(1);
	// for( anim_phase=0;anim_phase<2;anim_phase++){
	// 	redraw();
	// 	await sleep(30);
	// }
	// clearAnim();
	// redraw();

	// spawnRand(2);
	// for( anim_phase=0;anim_phase<2;anim_phase++){
	// 	redraw();
	// 	await sleep(30);
	// }
	// clearAnim();
	// redraw();
	
	moving=false;
	return Promise.resolve(1);
}


function animtick(){

	anim_phase++;
	if (anim_phase>anim_frames){
		anim_phase=anim_frames;
	}


	if (anim_phase<anim_frames)	{
		setTimeout(animtick,anim_length);		
	} else {
		phase=0;
	}

	redraw();
}

var piece_frames={
	1:["weiss","weiss_1","weiss_1","weiss_1"],
	2:["schwarz","schwarz_1","schwarz_1","weiss_1"],
	};

var bg_name =["winbg2_en","winbg2_de"];

function redraw(){

	
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(images[bg_name[sprache]], 0, 0);	

	//nächst
	var nox=115;
	var noy=113;
	var nächst_stück=tetrominos[nächst][nächst_drehung];

	var nächst_z_h=nächst_stück.length;
	var nächst_z_b=nächst_stück[0].length;
	var nächst_h=nächst_z_h*8;
	var nächst_b=nächst_z_b*8;
	nox+=(4*8-nächst_b)/2;
	noy+=(4*8-nächst_h)/2;
	for (var i=0;i<nächst_z_b;i++){
		for (var j=0;j<nächst_z_h;j++){
			var z=nächst_stück[j][i];
			if (z!==0){
				var x=nox+8*i;
				var y=noy+8*j;
				
				var lu = lookup(nächst,nächst_stück[j][i]);
				var tx=8*lu[0];
				var ty=8*lu[1];

				ctx.drawImage(images["template_1"],tx,ty,8,8,x,y,8,8);
			}
		}
	}

	projizieren();

	for(var i=0;i<3;i++){
		var z_b=3;
		var z_h=5;
		var z_x=125;
		var z_y=70;
		var ziffer= Math.floor(score/(Math.pow(10,i)))%10;
		ctx.drawImage(images["ziffer_sch"],3*ziffer,0,z_b,z_h,z_x+4*i,z_y,z_b,z_h);
	}


	for(var i=0;i<3;i++){
		var z_b=3;
		var z_h=5;
		var z_x=125;
		var z_y=43;
		var ziffer= Math.floor(highscore/(Math.pow(10,i)))%10;
		ctx.drawImage(images["ziffer_sch"],3*ziffer,0,z_b,z_h,z_x+4*i,z_y,z_b,z_h);
	}


	if (gameover){
		ctx.fillStyle = "#FF0000";
		for (var i=0;i<4;i++){
			ctx.fillRect( 55+4*i, 52, 1, 1 );
		}
	}

	for(i=0;i<6;i++){
		if (pressed[i]){
			var dat = image_x_y[i];
			ctx.drawImage(images[dat[sprache]],dat[2],dat[3]);
		}
	}
}

var image_names=[
	"winbg2_de",
	"winbg2_en",
	"template_1",
	"template_2",
	"template_3",
	"template_4",
	"template_5",
	"template_6",
	"template_7",
	"template_umriss",
	"ziffer_sch",
	"btn_oben_de",
	"btn_unten_de",
	"btn_links_de",
	"btn_rechts_de",
	"btn_oben_en",
	"btn_unten_en",
	"btn_links_en",
	"btn_rechts_en",
	"btn_neustart_de",
	"btn_neustart_en",
	"btn_sprache_de",
	"btn_sprache_en",
	];

var image_x_y=[
["btn_oben_en","btn_oben_de",14,16,82,11],
["btn_unten_en","btn_unten_de",14,175,82,11],
["btn_links_en","btn_links_de",2,28,11,146],
["btn_rechts_en","btn_rechts_de",97,28,11,146],
["btn_neustart_en","btn_neustart_de",112,16,39,11],
["btn_sprache_en","btn_sprache_de",125,175,14,11],
];

for (var i=0;i<image_names.length;i++){
	var image = new Image();
	image.onload = function () {
	    // draw the image into the canvas
	    redraw();
	}
	image.src = image_names[i]+".png";
	images[image_names[i]]=image;
}

function trypush(dx,dy){
	var anymoved=false;	
	for (var i=0;i<gw;i++){
		for (var j=0;j<gh;j++){
			if (state[i][j]===0){
				continue;
			}

			var ti=i+dx;
			var tj=j+dy;
			if (ti<0||ti>=gw||tj<0||tj>=gh){
				continue;
			}
			if (state[ti][tj]===0){
				state[ti][tj]=state[i][j];
				state[i][j]=0;

				anim[ti][tj][0]=anim[i][j][0]-dx;
				anim[ti][tj][1]=anim[i][j][1]-dy;
				anim[i][j][0]=0;
				anim[i][j][1]=0;


				anymoved=true;
			}
		}
	}
	return anymoved;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clearAnim(){
	for (var i=0;i<gw;i++){
		for (var j=0;j<gh;j++){
			anim[i][j][0]=0;
			anim[i][j][1]=0;
			spawn[i][j]=0;
		}
	}
}

function full(){
	for (var i=0;i<gw;i++){
		for (var j=0;j<gh;j++){
			if (state[i][j]===0){
				return true;
			}
		}
	}
	return false;
}

var moving=false;
async function doMove(dx,dy){

	var anymoved=false;

	clearAnim();

	var trymove=true;
	while(trymove){
		trymove=false;
		if (trypush(dx,dy)){
			trymove=true;
			anymoved=true;
		}
	}

	if (anymoved===false) {
		anim_phase=-1;
		redraw();
		await sleep(30);
		anim_phase=1;
		phase=1;
		redraw();
		return Promise.resolve(1);
	}
	playSound(11309707);

	phase=1;
	for( anim_phase=1;anim_phase<anim_frames;anim_phase++){
		redraw();
		await sleep(30);
	}


	phase=2;
	clearAnim();
	if (tryClear()){
		playSound(53413900);//blip
		await sleep(30);
		for( anim_phase=0;anim_phase<2;anim_phase++){
			redraw();
			await sleep(30);
		}
		clearAnim();
		redraw();
		await sleep(30);
	}

	phase=3;
	spawnRand(0);
	for( anim_phase=0;anim_phase<2;anim_phase++){
		redraw();
		await sleep(30);
	}
	clearAnim();
	redraw();


	phase=4;
	clearAnim();
	if (tryClear()){
		playSound(53413900);//blip
		await sleep(30);
		for( anim_phase=0;anim_phase<2;anim_phase++){
			redraw();
			await sleep(30);
		}
		clearAnim();
		redraw();
	}

	phase=0;
	redraw();

	return Promise.resolve(1);
}

async function doPress(i){

	if (moving===true){
		return;
	}

	moving=true;

	pressed[i]=true;
	
	if (i===0){
		// await doMove(0,-1);
		redraw();
	} else if (i===1){
		// await doMove(0,1);
		redraw();
	} else if (i===2){
		// await doMove(-1,0);
		redraw();
	} else if (i===3){	
		// await doMove(1,0);
		redraw();
	} else if (i===4){
		// await resetGame();
		redraw();
	} else if (i===5){
		sprache=1-sprache;
		// await resetGame();
		redraw();
	}

	moving=false;
}

function  getMousePos(evt) {
	var rect = canvas.getBoundingClientRect(), // abs. size of element
	scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
	scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

	var clientX=evt.clientX;
	var clientY=evt.clientY;

	if (scaleX<scaleY){
		scaleX=scaleY;
		clientX-=rect.width/2-(cw/scaleX)/2;
	} else {
		scaleY=scaleX;
		clientY-=rect.height/2-(ch/scaleY)/2;
	}
	var x = (clientX - rect.left) * scaleX;   // scale mouse coordinates after they have
	var y =(clientY - rect.top) * scaleY     // been adjusted to be relative to element

	return [x,y];
}

var target=-1;


function handleUntap(e){
	if (target>=0){
		pressed[target]=false;
		target=-1;
		redraw();
	}
}

function handleTap(e){


	var [mouseX,mouseY] =getMousePos(e);



	// var xoff=0;
	// var yoff=0;

	// var canvas_width_pixeled=Math.floor(canvas.width*canvas.width/rect.width);
	// var canvas_height_pixeled=Math.floor(canvas.width*canvas.height/rect.height);

	// xoff = Math.floor(canvas_width_pixeled/2-cw/2);
	// yoff = Math.floor(canvas_height_pixeled/2-ch/2);

	// mouseX+=xoff;
	// mouseY+=yoff;

	for (var i=0;i<image_x_y.length;i++){
		var dat = image_x_y[i];
		var x_min=dat[2];
		var y_min=dat[3];
		var x_max=dat[2]+dat[4];
		var y_max=dat[3]+dat[5];

		if (mouseX>=x_min&&mouseX<=x_max&&mouseY>=y_min&&mouseY<=y_max){

			if (target>=0){
				pressed[target]=0;
			}
			target=i;

			doPress(i);
		}
	}

}

function emptyCells(){
	var result=[];
	for(var i=0;i<gw;i++){
		for (var j=0;j<gh;j++){
			if (state[i][j]===0){
				result.push([i,j]);
			}
		}
	}
	return result;
}

function neighbors (x,y){
  var result=[];
  if (x>0){
    result.push([x-1,y]);
  }
  if (x<gw-1){
    result.push([x+1,y]);
  }
  if (y>0){
    result.push([x,y-1]);
  }
  if (y<gh-1){
    result.push([x,y+1]);
  }
  return result;
}

function versuchFloodFill(x,y,todelete){


	if (state[x][y]===0){
	  return false;
	}

  var farbe = state[x][y];
  
  var base_idx=x+gw*y;
  if (todelete.indexOf(base_idx)>=0){
    return false;
  }

  
  var visited=[base_idx];

  var modified=true;
  while(modified){
    modified=false;

    for (var i=0;i<gw;i++){
      for (var j=0;j<gh;j++){
        var idx = i+gw*j;
        if (visited.indexOf(idx)>=0){
          continue;
        }

        //check if you've visited neighbours
        var hasneighbour=false;
        var nbs = neighbors(i,j);
        for (var k=0;k<nbs.length;k++){
          var nb = nbs[k];
          var nbi=nb[0]+gw*nb[1];
          if (visited.indexOf(nbi)>=0){
            hasneighbour=true;
          }
        }
        if (hasneighbour===false){
          continue;
        }

        var zelle_farbe=state[i][j];
        if (zelle_farbe==0){
          //escaped -- return! :)
          return false;
        }
        if (zelle_farbe!==farbe){
          continue;
        }

        visited.push(idx);
        modified=true;
      }
    }
  }

  if (visited.length===16){
    visited=[];
  }
  for (var i=0;i<visited.length;i++){
    todelete.push(visited[i]);
  }
  return visited.length>0;
}

function tryClear(){
	if (emptyCells().length===0){
		if (gameover===false){
			playSound(38733900);
		}
		gameover=true;
		return false;
	}
  var todelete=[];
  for (var i=0;i<gw;i++){
    for (var j=0;j<gh;j++){
      var zelle=state[i][j];
      if (zelle==0){
        continue;
      }
      if (versuchFloodFill(i,j,todelete)){
      	score++;
      }
    }
  }
  for (var i=0;i<todelete.length;i++){
    var idx=todelete[i];
    var x = idx%gw;
    var y = Math.floor(idx/gw)
    clearCell(x,y);
  }
  return todelete.length>0;
}

function handleKey(e){
	if (e.key==="ArrowUp"||e.key=="W"||e.key=="w"){
		doPress(0);
		e.preventDefault();
		return false;
	}
	if (e.key==="ArrowDown"||e.key=="S"||e.key=="s"){
		doPress(1);
		e.preventDefault();
		return false;
	}
	if (e.key==="ArrowLeft"||e.key=="A"||e.key=="a"){
		doPress(2);
		e.preventDefault();
		return false;
	}
	if (e.key==="ArrowRight"||e.key=="D"||e.key=="d"){
		doPress(3);
		e.preventDefault();
		return false;
	}
	if (e.key.toLowerCase()==="r"||e.key.toLowerCase()==="n"){
		doPress(4);
		e.preventDefault();
		return false;
	}
	if (e.key.toLowerCase()==="e"||e.key.toLowerCase()==="e"){
		doPress(5);
		e.preventDefault();
		return false;
	}
}

var pressed=[false,false,false,false,false,false];

function handleKeyUp(e){
	if (e.key==="ArrowUp"||e.key=="W"||e.key=="w"){
		pressed[0]=false;
		redraw();
	}
	if (e.key==="ArrowDown"||e.key=="S"||e.key=="s"){
		pressed[1]=false;
		redraw();
	}
	if (e.key==="ArrowLeft"||e.key=="A"||e.key=="a"){
		pressed[2]=false;
		redraw();
	}
	if (e.key==="ArrowRight"||e.key=="D"||e.key=="d"){
		pressed[3]=false;
		redraw();
	}
	if (e.key.toLowerCase()==="r"||e.key.toLowerCase()==="n"){
		pressed[4]=false;
		redraw();
	}
	if (e.key.toLowerCase()==="e"||e.key.toLowerCase()==="e"){
		pressed[5]=false;
		redraw();
	}
	// console.log("keyup "+e.key)
}

canvas.addEventListener("pointerdown",handleTap);
canvas.addEventListener("pointerup",handleUntap);
document.addEventListener("keydown",handleKey);
document.addEventListener("keyup",handleKeyUp);

highscore = parseInt(localStorage.getItem('highscore'));
if (Number.isNaN(highscore)){
	highscore=0;
}
resetGame();