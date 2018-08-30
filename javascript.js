const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1400;
canvas.height = 1000;

//##########################################
//			CONSTANTS & VARIABLES
//##########################################

// CANVAS
var fWidth = canvas.width;
var fHeight = canvas.height;

// SYSTEM
const pi = 3.1416;
const eAngle = 3.1416*2;

var mouseDown = false;
var mousePos = {
	x: null,
	y: null,
	actX: null,
	actY: null
}
var mouseArray = [0,0,0,0];

const critterMaxSliderPop = 500;
const foodMaxSliderNum = 100;

var i;

document.cookie = Math.random();;


// OBJECT PARAMETERS
// Quadtree Node 
const qNodeMaxObj = 5;
var searchedList;
var largestNode;


// Critter
const critRadi = 10;
const critFaceRadi = 4;
const critFaceDis = critRadi/2;		// face distance to critter center
const critMaxAccel = 1;
const critFriction = 0.7;
const critMaxVel = -critFriction/(critFriction-1)+1;	//Takes into account friction, maxValue of critAccel()
const critMaxHp = 100;
const critMaxStam = 1000;
const critInitStam = 800;			// amount of stamina critters spawn with
const critInitStamRange = 100;		// amount of stamina critters spawn with variation (more and less)
const critShootPeriod = 100;		// amount of time it takes for critter to be able to shoot again
const critShootInitCharge = 0;		// amount of charge critter spawns with
const critShootDamage = 25;			// amount of health bullet takes from its target
const critShootStamCost = 5;		// amount of stamina is taken when firing
const critShootStamGain = 200;		// amount of stamina gained when bullet hits its target
const critMaxTurnSpeed = pi/10;
const critStamLoss = 1;
const critHpLossDueStam = 1;
const foodStamGain = 400;
const critInitChange = 0.1;			// This is an important variable as it give the critters the ability to increase or decrease their variation. This allows them to increase their adaptability or decrease it to become more specialised
const critInitChance = 0.05;		// This is an important variable as it give the critters the ability to increase or decrease their variation. This allows them to increase their adaptability or decrease it to become more specialised



const critNeighNum = 3;				// number of neighbours to find (EXCLUSIVE OF SELF)
// Problem: How do I prevent critters from shooting their spawn/siblings?
// Solution: Set critShootInitCharge = 0, after producing spawn


// Bullet
const bulletSpeed = 10;
const bulletRadi = 3;


// Food
const foodRadi = 4;


// CHANGABLE PARAMETERS
// WORLD
var critterQt;			// Stores the critter quadtree
var critterArray = [];
var foodQt;
var foodArray = [];
var critterMaxPop = 100;
var critterInitNum = 50;
var foodMaxNum = 100;		// Max amount of food
var foodInitNum = 30;
var autoSpawnOn = true;

// System
var gridOn = false;
var critRangeOn = false;
var printOn = false;
var critStatsOn = true;


//##########################################
//				 FUNCTIONS
//##########################################

function getDistance(changeX,changeY){
	return Math.sqrt(changeX**2+changeY**2);
}

function getAngle(oX,oY,pX,pY){
	return Math.atan2(pY-oY,pX-oX);
}

function bubbleSort(a1){
	let a = a1;

	let swapNum = -1;
	let temp;
	let subjectIndex;
	while(swapNum!==0){
		swapNum = 0;
		subjectIndex=0;   
			// console.log('NEW LOOP')

		for(let i=1;i<a.length;i++){
			// console.table(a);
			// console.log('swapNum',swapNum)
			// console.log('a[subjectIndex]',a[subjectIndex])
			// console.log('a[i]',a[i])

			if(a[subjectIndex]>a[i]){
			temp = a[i];
			a[i] = a[subjectIndex];
			a[subjectIndex] = temp;
			swapNum++;
			// console.log('swapNum INCREASE')

			}else{
			}
			// if(i===a.length-1){
			// 	console.log('END1 swapNum',swapNum)
			// }
			subjectIndex=i;

		}
		// console.log('END2 swapNum',swapNum)

	}
	return a;
}


function max(a,b){
	if(Math.abs(a)>Math.abs(b)){
		return a;
	}else{
		return b; 
	}
}
function min(a,b){
	if(a<b){
		return a;
	}else{
		return b; 
	}
}
//##########################################
//				  CLASSES
//##########################################

class QNode{
	constructor(x,y,w,h){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.objects = [];

		this.searched = false;
		if(gridOn){
			this.disp();
		}
	}
	// Adds objects to this.object array
	addObj(obj){

		// Exceeded max capacity
		if(typeof this.nw === "undefined"){
			// Place objects in THIS node

			this.objects.push(obj);
			// c.beginPath();
			// c.arc(obj.x,obj.y,1,0,3.1416*2);
			// c.fill();

			if(this.objects.length>qNodeMaxObj){
				// console.log('typeof this.nw === "undefined"');
				this.newNodes();
				for(let i=0;i<=qNodeMaxObj;i++){
					this.transferObjects(this.objects[i]);
				}
				this.objects = [];
			}
		}else{
			// Place objects in CHILDREN nodes

			this.transferObjects(obj);
			// console.log('typeof this.nw !== "undefined"');
		}
	}

	transferObjects(objI){
		let objIX = objI.x;
		let objIY = objI.y;

		if(this.nw.containP(objIX,objIY)){
			//nw
			this.nw.addObj(objI);

		}else if(this.ne.containP(objIX,objIY)){
			//ne
			this.ne.addObj(objI);

		}else if(this.sw.containP(objIX,objIY)){
			//sw
			this.sw.addObj(objI);

		}else if(this.se.containP(objIX,objIY)){
			//se
			this.se.addObj(objI);

		}else{
			if(printOn){
				console.log("ERROR: Doesn't fit in any of the nodes")
			}
		}
	}

	// Displays node
	disp(){
		c.beginPath();
		c.rect(this.x,this.y,this.w,this.h);
		c.stroke();
	}
	// Creates new Nodes
	newNodes(){
		let w2 = this.w/2;
		let h2 = this.h/2;
		this.nw = new QNode(this.x,this.y,w2,h2);
		this.ne = new QNode(this.x+w2,this.y,w2,h2);
		this.sw = new QNode(this.x,this.y+h2,w2,h2);
		this.se = new QNode(this.x+w2,this.y+h2,w2,h2);
	}
	// Checks if Node's coordinates can contain a point 
	containP(ptX,ptY){
		if(ptX>=this.x && ptX<this.x+this.w && ptY>=this.y && ptY<this.y+this.h){
			return true;
		}
		return false;
	}

	// Check if an Position with Range is within a Node
	// Input: COMBINED range of obj1 & obj2 
	query(x,y,r){
		if(critRangeOn){
			c.beginPath();
			c.arc(x,y,r,0,eAngle);
			// c.rect(x-r,y-r,r*2,r*2);//,3.1416*2);
			c.stroke();
		}
		if(this.searched === false){
			// console.log(this);
			// console.log('x,y,r',x,y,r);

			// SQUARE HITBOX
			if(x+r>=this.x && x-r<this.x+this.w && y+r>=this.y && y-r<this.y+this.h){
				// console.log('in')
				if(typeof this.nw === "undefined"){
					this.searched = true;
					searchedList[searchedList.length] = this;
					if(this.w*1.415>largestNode){
						largestNode = this.w*1.415;
					}
					return this.objects;
				}else{
					let collectedObjects = [];
					collectedObjects.push(...this.nw.query(x,y,r)||[]);
					collectedObjects.push(...this.ne.query(x,y,r)||[]);
					collectedObjects.push(...this.sw.query(x,y,r)||[]);
					collectedObjects.push(...this.se.query(x,y,r)||[]);

					if (this.nw.searched && this.ne.searched && this.sw.searched && this.se.searched ){
						this.searched = true;  //!#!@!#!@#!@#!@#
					}
					searchedList[searchedList.length] = this;
					return collectedObjects;
				}
			}//else{
			// 	// console.log('out')
			// }
		}

	}
	resetQuery(){
		let len = searchedList.length;
		for(let i=0;i<len;i++){
			searchedList[i].searched = false;
		}
	}
	// ASSUMPTIONS: Number of objects is greater or equal to AMOUNT
	// EXPANDS field of search
	batchQuery(x,y,r,amount){
		searchedList = [];
		let collectedObjects = [];
		let radius = r;
		largestNode = 0;
		while(collectedObjects.length<amount && largestNode<=radius){
			collectedObjects.push(...this.query(x,y,radius)||[]);
			// console.log('collectedObjects')
			// console.table(collectedObjects)
			if(radius<largestNode){
				radius+=largestNode;
			}else{
				if(radius>fWidth*1.5){
					if(printOn){
						// console.log("ERROR: too big search space")
						// console.log(x)
						// console.log(y)
					}
					this.resetQuery();
					return collectedObjects;
					// break;
				}
				radius+=radius*1.1;//fWidth/20;
			}
		}
		this.resetQuery();
		return collectedObjects;
	}
}




class Critter{
	constructor(x,y,w,b,change,chance){
		this.x = x;
		this.y = y;
		this.xVel = 0;
		this.yVel = 0;
		this.xAcc;
		this.yAcc;
		// this.magnitudeAcc;
		this.dir = 0;
		this.hp = critMaxHp;
		this.stam = critInitStam+~~(Math.random()*(critInitStamRange*2)-critInitStamRange);
		this.charge = critShootInitCharge;

		// Neural Network
		this.weights = w || [mCreate(8,18),mCreate(8,8),mCreate(2,8)];		//NOTE || is very LOOSE eg. 0||[] would return [] not 0
		// biases are [[b11,b12,b13],[b21,b22,b23]] format
		this.biases = b || [mCreate(1,8),mCreate(1,8),mCreate(1,2)];
		// console.log('this.x',this.x)
		// console.log('this.y',this.y)
		// this.mainFood;
		this.change = change+Math.random()*0.02-0.01 || critInitChange;
		this.chance = chance+Math.random()*0.01-0.005 || critInitChance;
	}

	// FIRST METHOD TO RUN EACH TICK
	update(){
		this.batchQueryFood();
		let [foodNeighboursDistance,foodNeighboursClosestIndexes]=this.orderedNeighboursIndexes(this.foodNeighbours,1);			//let [v1,v2]=returnedLists  WOW LOOK AT THIS!
		this.mainFoodDis = foodNeighboursDistance[0];
		// console.log(this.foodNeighbours)
		// console.log(foodNeighboursClosestIndexes[0])
		// console.log(foodNeighboursClosestIndexes[0])
		// console.log(this.foodNeighbours)
		// console.log(this.foodNeighbours[foodNeighboursClosestIndexes[0]])
		if(this.foodNeighbours.length!==0){
			this.mainFoodDir = getAngle(this.x,this.y,this.foodNeighbours[foodNeighboursClosestIndexes[0]].x,this.foodNeighbours[foodNeighboursClosestIndexes[0]].y);
		}else{
			this.mainFoodDis = 65500;
			this.mainFoodDir = 0;
		}
		// console.log('foodDist',this.foodDist)
		// console.log('critRadi',critRadi)
		// console.log('foodRadi',foodRadi)
		if(this.mainFoodDis<=critRadi+foodRadi){
			// console.log('jgjhghjgjhghj')
			this.stam+=foodStamGain;
			if(this.stam>critMaxStam){
				this.stam=critMaxStam;
			}
			this.foodNeighbours[foodNeighboursClosestIndexes[0]].jump();
			//foodArray[0].jump();
			this.reproduce(5);
		}
		if(this.stam===0){
			this.hp -= critHpLossDueStam;
		}else{
			this.stam -= critStamLoss;
		}
		if(critStatsOn){
			c.fillText(this.stam,this.x,this.y+17);
			c.fillText(this.hp,this.x,this.y+27);
		}
		if(this.hp===0){
			this.delete();
		}
	}



	reproduce(children){
		let i=0;
		while(i<5 && critterArray.length<critterMaxPop){
			i++;
			let childWeights = mMutatedCopy(this.weights,this.change,this.chance);
			let childBiases = mMutatedCopy(this.biases,this.change,this.chance);
			// console.log('this.weights')
			// console.table(this.weights)
			// console.log('childWeights')
			// console.table(childWeights)
			// console.log('this.biases')
			// console.table(this.biases)
			// console.log('childBiases')
			// console.table(childBiases)

			critterArray[critterArray.length] = new Critter(this.x+Math.random()*5,this.y+Math.random()*5,childWeights,childBiases,this.change,this.chance);
			critterQt.addObj(critterArray[critterArray.length-1]);
		}
	}

	delete(){
		critterArray.splice(i,1);
		i--;
	}

	nerualControl(){
		// Collecting Inputs:
		// WATCH OUT FOR THE -1's
		this.batchQuery();
		let [neighboursDistance,neighboursClosestIndexes]=this.orderedNeighboursIndexes(this.neighbours,critNeighNum);			//let [v1,v2]=returnedLists  WOW LOOK AT THIS!
		// console.log('this.neighbours',this.neighbours);
		// console.log('neighboursClosestIndexes',neighboursClosestIndexes);
		// console.log('neighboursDistance',neighboursDistance);
		let otherAngles = [];
		let otherVels = [];
		let otherAnglesTheir = [];			// Other critters' angles
		for(let i=0;i<critNeighNum;i++){
			let thisNeighCloseI = this.neighbours[neighboursClosestIndexes[i]];
			if(neighboursClosestIndexes[i]!==-1 && thisNeighCloseI !== undefined && i<neighboursDistance.length){
				// console.log('i',i);
				otherAngles[i] = getAngle(this.x,this.y,thisNeighCloseI.x,thisNeighCloseI.y);
				otherVels[i] = getDistance(thisNeighCloseI.xVel,thisNeighCloseI.yVel)/critMaxVel;
				otherAnglesTheir[i] = thisNeighCloseI.dir;
			}else{
				otherAngles[i] = 0;
				neighboursDistance[i] = 65500;
				otherVels[i] = 0;
				otherAnglesTheir[i]=0;
			}
		}
		// console.log('otherVels',otherVels)
		// console.log('otherAngles',otherAngles);
		// console.log('neighboursDistance',neighboursDistance);
		// console.log('otherAnglesTheir',otherAnglesTheir)
		//food stuff
		// console.log('this.mainFoodDir',this.mainFoodDir)
		// console.log('this.mainFoodDis',this.mainFoodDis)

		//this(self) stuff
		let thisVel = getDistance(this.xVel,this.yVel)/critMaxVel;
		// this.dir = this.dir%Math.PI*2;
		// formatting inputs
		// REM CAN'T DIVIDE BY ZERO
		let inputStates = [[1/(this.mainFoodDis+0.1)],[(this.mainFoodDir-this.dir)%eAngle/eAngle-0.5],[this.hp/critMaxHp],[this.stam/critMaxStam],[thisVel/critMaxVel],[this.dir%eAngle/eAngle-0.5],
			[1/(neighboursDistance[0]+0.1)],[(otherAngles[0]-this.dir)%eAngle/eAngle-0.5],[otherVels[0]/critMaxVel],[otherAnglesTheir[0]%eAngle/eAngle-0.5],
			[1/(neighboursDistance[1]+0.1)],[(otherAngles[1]-this.dir)%eAngle/eAngle-0.5],[otherVels[1]/critMaxVel],[otherAnglesTheir[1]%eAngle/eAngle-0.5],
			[1/(neighboursDistance[2]+0.1)],[(otherAngles[2]-this.dir)%eAngle/eAngle-0.5],[otherVels[2]/critMaxVel],[otherAnglesTheir[2]%eAngle/eAngle-0.5]
		];
		
		// console.log('this.x,this.y',this.x,this.y)

		// Neural Network Calculations
		// 3 pases (4 layers)

		// console.log('this.weights[0]')
		// console.table(this.weights[0])
		// console.log('inputStates')
		// console.table(inputStates)
		let temp = mDot(this.weights[0],inputStates);
		// console.log('mDot temp')
		// console.table(temp)
		mReluAdd(temp,this.biases[0]);	// DOESN'T RETURN   JUST LIKE mMutate
		// console.log('mReluAdd temp')

		// mSigmoidAdd(temp,this.biases[0]);	// DOESN'T RETURN   JUST LIKE mMutate
		// console.log('mSigmoidAdd temp')
		// console.table(temp)

		// console.log('0 temp:')
		// console.log(temp)
		// console.log('this.weights[0]',this.weights[0])
		// console.log('inputStates',inputStates)
		for(let i=1;i<this.weights.length;i++){
			// console.table('b i,temp',i,temp);
			temp = mDot(this.weights[i],temp);
		// console.log('mDot temp')
		// console.table(temp)
			if(i===this.weights.length-1){
				mSigmoidAdd(temp,this.biases[i]);
				// console.log('mSigmoidAdd temp')
				// console.table(temp)

			}else{
				mReluAdd(temp,this.biases[i]);
				// console.log('mReluAdd temp')
				// console.table(temp)
			}
			// console.table('a i,temp',i,temp);

		}
		// console.log('actionMatrix',temp);
		let actionM = temp;
		//actionM[0]==turning,actionM[1]==accel,actionM[2]==dash,actionM[3]==shootdir,actionM[4]==fire
		let dirSpeed = actionM[0][0];
		let magAcc = actionM[1][0];
		// console.log(dirSpeed,magAcc)
		this.dir += dirSpeed-0.5;

		// Move
		//magAcc is between 0 to 1 due to sigmoid
		this.xVel += critMaxAccel*magAcc*Math.cos(this.dir);	
		this.yVel += critMaxAccel*magAcc*Math.sin(this.dir);
		this.x += this.xVel;
		this.y += this.yVel;
		this.xVel *= critFriction;
		this.yVel *= critFriction;
		// if(isNaN(this.x)){
		// }
	}

	// Finds food objects within 40 radius and more until
	batchQueryFood(){
		this.foodNeighbours = foodQt.batchQuery(this.x,this.y,40,1);
	}


	// Finds objects within 20 radius and more untill has critNeighNum+1 objects fouond or exceed max length
	batchQuery(){
		this.neighbours = critterQt.batchQuery(this.x,this.y,20,critNeighNum+1);
		// return this.neighbours;
	}

	// RETURNS: 2 Lists:
	//				1: ORDERED Distances of neighbours(critter/food)
	//				2: ORDERED Indexes based off the 'orderingList' from which index of the 'orderingList' has closest neighbour 
	orderedNeighboursIndexes(orderingList,neighboursToFind){
		// Populate a distance list
		let neighboursDistance = [];

		// console.log(neighboursToFind,neighboursToFind,neighboursToFind,neighboursToFind,neighboursToFind)
		// console.log('orderingList.length')
		// console.table(orderingList.length)

		// console.log('VERY BEGINNING LOOP')
		for(let i=0;i<orderingList.length;i++){

			// console.log('orderingList[i]')
			// console.table(orderingList[i])
			// console.log('orderingList[i].x',orderingList[i].x)
			// console.log('this.x',this.x)
			// console.log('orderingList[i].y',orderingList[i].y)
			// console.log('this.y',this.y)
			neighboursDistance[i] = getDistance(orderingList[i].x-this.x,orderingList[i].y-this.y);
			// console.log('neighboursDistance[i]')
			// console.log(neighboursDistance[i])
		}
		// console.log('OUT VERY BEGINNING LOOP')

		// console.log('unordered')
		// console.table(neighboursDistance);
		// Copy the above distance list
		let neighboursDistanceOriginal = [];
		for(let i=0;i<neighboursDistance.length;i++){
			neighboursDistanceOriginal[i] = neighboursDistance[i];
		}
		// Sort the first distance list (from closest to furthest)?
		bubbleSort(neighboursDistance);
		// console.log('ordered')
		// console.table(neighboursDistance);

		// Store indexes of the closest neighbours from the passed "orderingList"
		let neighboursClosestIndexes = [];
		// DON'T ignore the first in the ordered orderingList list (as it could be outside of canvas)
		// console.log('LOOP')
		let foundSelf = false;
		for (let i=0;i<=neighboursToFind;i++){
			let theIndex = neighboursDistanceOriginal.indexOf(neighboursDistance[i]);
			// console.log('this')
			// console.log(this)
			// console.log('orderingList[theIndex]')
			// console.log(orderingList[theIndex])
			// console.log('neighboursDistance')
			// console.table(neighboursDistance)
			// console.log('i')
			// console.log(i)
			if(this!==orderingList[theIndex]){
				neighboursClosestIndexes[neighboursClosestIndexes.length] = theIndex;
				if(neighboursClosestIndexes.length===neighboursToFind){
					i=neighboursToFind+1;
					// console.log('returning route 1')
					// console.log('neighboursDistance.slice(1)')
					// console.table(neighboursDistance.slice(1))
					// console.log('neighboursClosestIndexes')
					// console.log(neighboursClosestIndexes)
					if(foundSelf){
						return [neighboursDistance.slice(1),neighboursClosestIndexes];
					}else{
						return [neighboursDistance,neighboursClosestIndexes];
					}

				}
			}else{
				foundSelf = true;
				// console.log('FOUND MYSELF!')
			}
		}
		// console.log('returning route 0')
		// alert('THIS SHOULD NOT RUN, IF IT DOES SOMETHING WENT WRONG')
		// return [neighboursDistance,neighboursClosestIndexes];
	}


	// REM: ITSELF NOT INCLUDED!!!
	// COULDN'T FIND MATCH SITUATIONS


	// Displays critter
	// this.dir === 0degrees is facing right, this.dir === -90degrees is facing up
	display(){
		c.beginPath();
		c.arc(this.x,this.y,critRadi,0,eAngle);
		c.stroke();
		c.beginPath();
		c.arc(this.x+critFaceDis*Math.cos(this.dir),this.y+critFaceDis*Math.sin(this.dir),critFaceRadi,0,eAngle);
		c.fill();
	}
	//critFaceDis
	//critMaxAccel
	//critMaxVel
	//critMaxHp
	//critMaxStam
	//critInitStam
	//critShootPeriod
	//critShootInitCharge

	//critShootDamage
	//critShootStamCost
	//critShootStamGain


}


class Food{
	constructor(x,y){
		this.x = x;
		this.y = y;
	}
	// collision(){
	// 	this.objects = critterQt.query(x,y,critRadi+foodRadi);
	// }
	jump(){
		this.x = 20+Math.random()*(fWidth-40);
		this.y = 20+Math.random()*(fHeight-40);
	}
	display(){
		c.beginPath();
		c.arc(this.x,this.y,foodRadi,0,eAngle);
		c.fill();
	}
}


//##########################################
//				 HTML STUFF
//##########################################

const coords = document.getElementById('coords');

const gridCheckBox = document.getElementById('gridCheckBox');
const critRangeCheckBox = document.getElementById('critRangeCheckBox');
const critStatsCheckBox = document.getElementById('critStatsCheckBox');
const printCheckBox = document.getElementById('printCheckBox');
const autoSpawnCheckBox = document.getElementById('autoSpawnCheckBox');


const foodCounterDisplay = document.getElementById('foodCounterDisplay');
const foodCounterSlider = document.getElementById('foodCounterSlider');

const critMaxPopDisplay = document.getElementById('critMaxPopDisplay');
const critMaxPopSlider = document.getElementById('critMaxPopSlider');

const critNumDisplay = document.getElementById('critNumDisplay');

// Setting HTML checkboxes
gridCheckBox.checked = gridOn;
critRangeCheckBox.checked = critRangeOn;
printCheckBox.checked = printOn;
autoSpawnCheckBox.checked = autoSpawnOn;
critStatsCheckBox.checked = critStatsOn;

// HTML EVENTLISTENERS
function gridChange(){
	gridOn=!gridOn;
}
function critRangeChange(){
	critRangeOn=!critRangeOn;
}
function printChange(){
	printOn=!printOn;
}
function autoSpawnChange(){
	autoSpawnOn=!autoSpawnOn;
}
function critStatsChange(){
	critStatsOn=!critStatsOn;
}

foodCounterDisplay.innerHTML = foodInitNum;
foodCounterSlider.max = foodMaxSliderNum;
foodCounterSlider.value = foodInitNum;

foodCounterSlider.oninput = function() {
	foodMaxNum = foodCounterSlider.value;
	foodCounterDisplay.innerHTML = foodMaxNum;
	if(foodArray.length<foodMaxNum){
		while(foodArray.length<foodMaxNum){
			spawnFood(foodArray.length);
		}
	}
	if(foodArray.length>foodMaxNum){
		while(foodArray.length>foodMaxNum){
			foodArray.length=foodMaxNum;
		}
	}
}

critMaxPopDisplay.innerHTML = critterMaxPop;
critMaxPopSlider.max = critterMaxSliderPop;
critMaxPopSlider.value = critterMaxPop;

critMaxPopSlider.oninput = function() {
	critterMaxPop = critMaxPopSlider.value;
	critMaxPopDisplay.innerHTML = critterMaxPop;
}

function spawnCrittersButton(){
	for (let i=0;i<10;i++){
		spawnCritters(critterArray.length);
	}
}

//##########################################
//	EVENTLISTENERS & AUXILIARY FUNCTIONS
//##########################################

function trueMousePos(eX,eY){
	let rect = canvas.getBoundingClientRect();
	mousePos.x = eX-rect.left;
	mousePos.y = eY-rect.top;
	mousePos.actX = eX-rect.left;
	mousePos.actY = eY-rect.top;
	if(mousePos.x>fWidth){
		mousePos.x=fWidth;
	}
	if(mousePos.x<0){
		mousePos.x=0;
	}
	if(mousePos.y>fHeight){
		mousePos.y=fHeight;
	}
	if(mousePos.y<0){
		mousePos.y=0;
	}
}

// inputs of x:0,y:0 is assumed to be canvas's top left
function withinCanvas(x,y){
	if(x>fWidth || x<0 || y>fHeight || y<0){
		return false;
	}else{
		return true;
	}
}

window.addEventListener('mousemove',function(e){
	trueMousePos(e.x,e.y)
	coords.innerHTML = 'x: '+ ~~mousePos.x + '<br> y: ' + ~~mousePos.y;
});
window.addEventListener('mousedown',function(e){
	trueMousePos(e.x,e.y);
	mouseDown = true;
	// console.log(mousePos.x,mousePos.y)

	// console.log('DISTANCE: ',getDistance(mousePos.x-mouseArray[mouseArray.length-2],mousePos.y-mouseArray[mouseArray.length-1]))
	mouseArray[mouseArray.length]=mousePos.x;
	mouseArray[mouseArray.length]=mousePos.y;

	if(withinCanvas(mousePos.actX,mousePos.actY)){
		foodArray[0].x = mousePos.x;
		foodArray[0].y = mousePos.y;
	}
	// critterQt.addObj({x:mousePos.x,y:mousePos.y})

	// c.beginPath();
	// c.arc(mousePos.x,mousePos.y,1,0,3.1416*2);
	// c.fill();
});
window.addEventListener('mouseup',function(e){
	mouseDown = false;
});


function spawnFood(index){
	foodArray[index] = new Food(20+Math.random()*(fWidth-40),20+Math.random()*(fHeight-40));
}

function spawnCritters(index){
	critterArray[index] = new Critter(20+Math.random()*(fWidth-40),20+Math.random()*(fHeight-40));
}


//##########################################
//				  MAIN CODE
//##########################################


// Create Critters
for (let i=0;i<critterInitNum;i++){
	spawnCritters(i);
}

// Create Food
for (let i=0;i<foodInitNum;i++){
	spawnFood(i);
}
// critterArray[critterArray.length] = new Critter(2.5*fWidth,1.5*fHeight);



function tick(){

	c.clearRect(0,0,fWidth,fHeight);


	// FOOD
	foodQt = new QNode(0,0,fWidth,fHeight);
	let foodLen = foodArray.length;
	// Add food to quadtree
	for(i=0;i<foodLen;i++){
		foodQt.addObj(foodArray[i]);
	}
	// DISPLAY FOOD
	c.fillStyle='rgb(50,200,50)';
	for(i=0;i<foodLen;i++){
		foodArray[i].display();
	}
	c.fillStyle='rgb(0,0,0)';


	// CRITTER
	// Create Critter Quadtree
	critterQt = new QNode(0,0,fWidth,fHeight);
	// Add critters to quadtree
	for (i=0;i<len;i++){
		critterQt.addObj(critterArray[i]);
	}
	// Critter Functionality
	for(i=0;i<critterArray.length;i++){
		critterArray[i].update();
		if(critterArray[i]){
			critterArray[i].nerualControl();
			critterArray[i].display();
		}
	}

	// Create new population of critters if 'autoSpawnOn' === true and critterArray.length === 0
	if(autoSpawnOn && critterArray.length<1){
		let spawnCap = min(critterInitNum,critterMaxPop);
		for (let i=0;i<spawnCap;i++){
			spawnCritters(i);
		}
	}

	len = critterArray.length;

	// HTML STUFF
	critNumDisplay.innerHTML = len;

	requestAnimationFrame(tick);
}

let len = critterArray.length;

tick();


// critterQt.disp();

// critterQt.addObj({x:28,y:59})
// critterQt.addObj({x:40,y:54})
// critterQt.addObj({x:48,y:34})
// critterQt.addObj({x:45,y:44})
// critterQt.addObj({x:68,y:49})
// critterQt.addObj({x:68,y:39})
// console.log(critterQt)

// critterQt.addObj({x:40,y:54})
// critterQt.addObj({x:40,y:54})
// critterQt.addObj({x:40,y:54})
// critterQt.addObj({x:40,y:54})
// critterQt.addObj({x:40,y:60})
// critterQt.addObj({x:40,y:60})
// // a = critterQt.query(40,56,20)
// critterQt.batchQuery(250,58,20,4)


function displayOne(ind){
	c.clearRect(0,0,fWidth,fHeight);
	var len = critterArray.length 
	c.clearRect(0,0,fWidth,fHeight);
		critterQt = new QNode(0,0,fWidth,fHeight);
		// Add critters to quadtree
		for (let i=0;i<len;i++){
			critterQt.addObj(critterArray[i]);
		}
			for(let i=0;i<len;i++){
			critterArray[i].display();
		}
	critterArray


	var i =ind
	return critterQt.batchQuery(critterArray[i].x,critterArray[i].y,20,critNeighNum+1)
}
// displayOne(0);



/*
name = "testing";
document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
*/


function findAve(){
	let changeSum = 0;
	let chanceSum = 0;
	let len = critterArray.length;
	for(let i=0;i<len;i++){
		changeSum+=critterArray[i].change;
		chanceSum+=critterArray[i].chance;
	}
	console.log('changeAve',changeSum/len,'change Default',critInitChange);
	console.log('chanceAve',chanceSum/len,'change Default',critInitChance);
}