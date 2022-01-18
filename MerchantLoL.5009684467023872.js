/**
	DevTool
*/
function DevTool(){
	throw new Error('This is a static class');
}
const dt = DevTool;
DevTool.DEBUG = true;

DevTool.error = function(msg){
	if(DevTool.DEBUG){
		game_log(msg);
		throw new Error(msg);
	}	
};
DevTool.log = function(msg){
	if(DevTool.DEBUG){
		game_log(msg);	
	}
};
/* END DevTool */

/**
	Util
*/
function Util(){
	throw new Error('This is a static class');
}
Util.getElapsedTime = function(date){	
	return date? Date.now() - date.getTime() : Infinity;
};
Util.sleep = function(ms){ // with await
	return new Promise((resolve) => setTimeout(resolve, ms));
};
/* END Util */

/**
	CharacterManager
*/
function CharacterManager() {
    throw new Error('This is a static class');
}

CharacterManager.Space = [
	{x: -200, y: -72},
	{x: -118, y: 10}	
];
CharacterManager.Actions = Object.freeze({
	openStand: async function(i){
		i === i || 0;
		const space = CharacterManager.Space[i];
		
		await CharacterManager.Actions.closeStand();
		while(!character.stand){
			await smart_move(space.x, space.y - 1);
			await move(space.x, space.y);
			await open_stand();
			set_message("Open Stand");
			await Util.sleep(character.ping);
		}		
	},
	closeStand: async function(){
		while(character.stand){
			close_stand();
			set_message("Close Stand");
			await Util.sleep(character.ping);
		}
	}
});
/* END CharacterManager */

/**
	PartyManager
*/
function PartyManager() {
    throw new Error('This is a static class');
}
PartyManager.INTERVAL_TIME = 10000;
PartyManager.acceptParty = function(){
	game_log("PartyManager.acceptParty");
	const intervalID = setInterval(function(){
		accept_party_invite(GameManager.Player.main);
		if(PartyManager.isInParty()){
			clearInterval(intervalID);
		}
	}, PartyManager.INTERVAL_TIME);
};
PartyManager.isInParty = function(name){
	name = name || character.name;
	return !!get_party()[name];
};
/* END PartyManager */

/**
	GameManager
*/
function GameManager() {
    throw new Error('This is a static class');
}
GameManager.Player = Object.freeze({
	main: "WarriorLoL",
	warrior: "WarriorLoL",
	mage: "MageLoL",
	priest: "PriestLoL",
	merchant: "MerchantLoL"
});

GameManager.Actions = Object.freeze({
});
GameManager.checkAction = function(){
};
GameManager.Action = function(callback){
	return () => {
		callback();
	};
};
GameManager.Tick = Object.freeze({
	returning: GameManager.Action(function(){
		set_message("Return Town");
		CharacterManager.returnTown();
	})
});

GameManager.init = function(){
	change_target(null);
	CharacterManager.Actions.closeStand();
	CharacterManager.Actions.openStand(1);
	PartyManager.acceptParty();
};

GameManager.idlePlay = function(){
	setTimeout(async function(){
		const cycleTime = character.ping;
		GameManager.init();
	}, 0);
};
/* END GameManager */

/**************************************************
	Main
**************************************************/
GameManager.idlePlay();

/* END Main */

// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland
