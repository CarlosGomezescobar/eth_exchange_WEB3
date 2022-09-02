Moralis.initialize("Nu8txxsw97lrPRZPbj7hiUzpHzgj1sG0eUf8kbV0"); //Application id from moralis.io
Moralis.serverURL = "https://qxivmoxoso8q.usemoralis.com:2053/server"; //Server URl from Moralis.io

let currentTrade = {};
let currentSelectSide;
let tokens; 

async function init(){
	await Moralis.initPlugins();
	await Moralis.enable();
	await listAvaibleToken();
	currentUser = Moralis.User.current();
	if(currentUser){
		document.getElementById("swap_button").disabled = false;
	}
	
}

async function listAvaibleToken(){
	const result = await Moralis.Plugins.oneInch.getSupportedtokens({

		chain: 'eth', // the blockchain you want to use (eth/bsc/polygon)
	});
	tokens = result.tokens;
	let parent = document.getElementById("tokens_list");
	for( const address in tokens){
		let token = tokens[address];
		let div = document.createElement("div");
		div.setAttribute("data-address", address)
		div.className = "token_row";
		let html = `
		<img class="token_list_img"src="${token.logoURI}">
		<span class="token_list_text">${token.symbol}</span>

		`
		div.innerHTML = html;
		div.onclick = (() => {selectToken(address)});
		parent.appendChild(div);
	}
}
async function selectToken(address){
	closeModal();
	//let address = event.target.getAttribute("data-address");
	console.log(tokens);
	currentTrade[currentSelectSide] = tokens[address];
	console.log(currentTrade);
	renderInterface();
	getQuote();
}

function renderInterface(){
	if(currentTrade.from){
		document.getElementById("from_token_img").src = currentTrade.from.logoURI;
		document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
	}
	if(currentTrade.to){
		document.getElementById("to_token_img").src = currentTrade.to.logoURI;
		document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
	}	
}

async function login(){
	try {
		currentUser = Moralis.User.current();
		if(!currentUser){
			currentUser = await Moralis.web3.authenticate();
		}
		document.getElementById("swap_button").disabled = false;
	} catch (error){
		console.log(error);
	}
}

function openModal(side){
	currentSelectSide = side;
	document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
	document.getElementById("token_modal").style.display = "none";
}
async function getQuote(){
	if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;

	let amount = Number( 
		document.getElementById("from_amount").value * 10**currentTrade.from.decimals
	)

	const quote = await Moralis.Plugins.oneInch.quote({
	 	chain: 'eth',
	 	fromTokensAddress: currentTrade.from.address, // The Token you want to swap
	 	toTokensAddress: currentTrade.to.address, // The token you want to receive
	 	amount: amount,
	})
	console.log(quotes);
	document.getElementById("gas_estimate").innerHTML = quote.estimateGas;
	document.getElementById("to_amount").value = quote.toTokenAmount / (10**quote.toToken.decimals)
}
async function trySwap(){
	let address = Moralis.User.current().get("ethAddress");
	let amount = Number( 
			document.getElementById("from_amount").value * 10**currentTrade.from.decimals
		)
	if(currentTrade.from.symbol !== "ETH"){
		
		const allowance = await Moralis.Plugins.oneInch.hasAllowance({
			chain: 'eth',
			fromTokensAddress: currentTrade.from.address,
			toTokensAddress: address,
			amount: amount,
		})
		console.log(allowance):
		if (!allowance){
			await Moralis.Plugins.oneInch.approve({
				chain: 'eth',
				fromTokensAddress: currentTrade.from.address,
				toTokensAddress: address,
				
			});
		}
	}
	let receipt = await doSwap(address, amount);
	alert("Swap Complete");
}

function doSwap(userAddress, amount){
	return Moralis.Plugins.oneInch.swap({
		chain: 'eth',
		fromTokensAddress: currentTrade.to.address,
		toTokensAddress: address,
		amount: amount,
		fromAddress: userAddress,
		slippage: 1,
	});
}

init();

document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_token_select").onclick = (() => {openModal("from")});
document.getElementById("to_token_select").onclick = (() => {openModal("to")});
document.getElementById("login_button").onclick = login;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;
