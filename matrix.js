

// Creates a matrix with random weights(from 0.5 to)
// Input: m rows, n columns
function mCreate(rows,cols){
	let tempM = [];
	for(let i=0;i<rows;i++){
		tempM[i]=[];
		for(let j=0;j<cols;j++){
			tempM[i][j]=Math.random()-0.5;  // from -0.5 to <0.5
		}
	}
	return tempM;
}

function relu(net){
	if(net<0){
		return 0;
	}else{
		return net;
	}
}

function mRelu(m1){
	for(let i=0;i<m1.length;i++){
		for(let j=0;j<m1[0].length;j++){
			m1[i][j] = relu(m1[i][j]);
		}
	}
}

function mReluAdd(m1,b){
	for(let i=0;i<m1.length;i++){
		for(let j=0;j<m1[0].length;j++){
			m1[i][j] = relu(m1[i][j]+b[0][j]);
		}
	}
}

function sigmoid(net){
	return 1/(1+Math.exp(-net));
}

function mSigmoid(m1){
	for(let i=0;i<m1.length;i++){
		for(let j=0;j<m1[0].length;j++){
			m1[i][j] = sigmoid(m1[i][j]);
		}
	}
}

function mSigmoidAdd(m1,b){
	for(let i=0;i<m1.length;i++){
		for(let j=0;j<m1[0].length;j++){
			m1[i][j] = sigmoid(m1[i][j]+b[0][j]);
		}
	}
}

function bellDistrib(x){
	return Math.exp(-9*x**2);
}

// Multiplys two matrixes
// Input: m1, m2
// ASSUMPTIONS: m1 cols === m2 rows
//				m2 is a column matrix
function mDot(m1,m2){
	let tempM = [];
	if(m1[0].length===m2.length){
		for(let i=0;i<m1.length;i++){
			tempM[i]=[];
			let sum=0;
			for(let j=0;j<m2.length;j++){
				sum=sum+m1[i][j]*m2[j][0];
			}
			tempM[i][0] = sum;
		}
		return tempM;
	}else{
		console.log('ERROR: m1 cols !== m2 rows')
	}
}


// Turns this array [1,5,8] into [[1],[5],[8]] so we can use the above matrix operations
function mFormat(m1){
	let tempM = [];
	for(let i=0;i<m1.length;i++){
		tempM[i] = [m1[i]];
	}
	return tempM;
}

// Mutates values by a certain amount (mRate) DOESN'T MAKE COPY
function mMutate(m1,mRate){
	for(let i=0;i<m1.length;i++){
		for(let j=0;j<m1[0].length;j++){
			m1[i][j]+=2*mRate*Math.random()-mRate;
		}
	}
}

// Mutates values by a certain amount (mChange) DOESN'T MAKE COPY
function mMutatedCopy(m1,mChange,mChance){
	let tempM = [];
	for(let i=0;i<m1.length;i++){
		tempM[i] = mMutatedCopy2(m1[i],mChange,mChance);
	}
	return tempM;
}
// Mutates values by a certain amount (mChange) DOESN'T MAKE COPY
function mMutatedCopy2(m1,mChange,mChance){
	let tempM = [];
	for(let i=0;i<m1.length;i++){
		tempM[i] = [];
		for(let j=0;j<m1[0].length;j++){
			tempM[i][j] = m1[i][j];
			if(Math.random()<mChance){
				tempM[i][j]+=2*mChange*Math.random()-mChange;
			}
		}
	}
	return tempM;
}
