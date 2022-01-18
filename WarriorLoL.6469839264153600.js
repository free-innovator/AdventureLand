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

CharacterManager.Actions = Object.freeze({
	loot: () => loot(),
	hunting: function(){
		if(character.rip || is_moving(character)) return;
	
		const target = 
			  get_targeted_monster() || CharacterManager.getTargetMonster();

		if(target){
			change_target(target);
		}else{
			set_message("No Monsters");
			return;
		}

		if(!is_in_range(target)){
			move(
				character.x+(target.x-character.x)/2,
				character.y+(target.y-character.y)/2
			); // Walk half the distance
		}else if(can_attack(target)){
			set_message("Attacking");
			attack(target).then(() => reduce_cooldown("attack", character.ping));
			CharacterManager.attackDate = new Date();
		}
	},
	usePotion: function(){
		if(character.hp / character.max_hp < 
		   GameManager.Potion.HP_USE_RATIO) CharacterManager.useHPotion();
		if(character.mp / character.max_mp <
		   GameManager.Potion.MP_USE_RATIO) CharacterManager.useMPotion();
	}
});

CharacterManager.smartMove = async function(dest){
	if(!is_moving(character)){
		await smart_move({to: dest});
	}
};
CharacterManager.getAttackElapsedTime = function(){
	if(!CharacterManager.attackDate) return 0;
	return Util.getElapsedTime(CharacterManager.attackDate);
};
CharacterManager.getTargetMonster = function(type){
	return get_nearest_monster({
		min_xp: GameManager.Monster.MIN_XP, 
		max_att: GameManager.Monster.MAX_ATTACK,
		type: type
	});
};
CharacterManager.isInBattleArea = function(){
	const monster = 
		 CharacterManager.getTargetMonster(GameManager.Monster.TARGET_NAME);
	return !!monster;
};
CharacterManager.isInTown = function(){
	return Math.abs(character.x) < 200 && Math.abs(character.y) < 200;
};
CharacterManager.isOnPotionCooldown = function(type){
	let boolA;
	const boolB = is_on_cooldown(`use_${type}p`);
	if(type === "h"){
		boolA = Util.getElapsedTime(
			CharacterManager.useHPotionDate) < G.skills.use_hp.cooldown	
	}else if(type === "m"){
		boolA = Util.getElapsedTime(
			CharacterManager.useMPotionDate) < G.skills.use_mp.cooldown	
	}
	
	return boolA || boolB;
};
CharacterManager.isCanMoveToTarget = function(target){
	target = target || get_targeted_monster();
	return target ? can_move_to(target) : true;
};

CharacterManager._usePotion = function(type){
	const skill = `use_${type}p`;
	if(!CharacterManager.isOnPotionCooldown(type)){
		use_skill(skill);
		game_log(`use ${type.toUpperCase()}P potion`);
		
		if(type === 'h'){
			CharacterManager.useHPotionDate = new Date();
		}else if(type === 'm'){
			CharacterManager.useMPotionDate = new Date();
		}
	}
};
CharacterManager.useHPotion = function(){
	CharacterManager._usePotion('h');
};
CharacterManager.useMPotion = function(){
	CharacterManager._usePotion('m');
};
CharacterManager.returnTown = async function(){
	if(CharacterManager.isInTown()){
		GameManager.needReturn = false;
		stop("smart", 0);
	}else{
		use_skill("use_town");
		CharacterManager.smartMove("town");
	}
};

CharacterManager._getPotionCnt = function(type, grade){
	grade = grade? grade : 0;
	const item = character.items.find(x => x && x.name === `${type}pot${grade}`);
	return item? item.q : 0;
};
CharacterManager.getHPotionCnt = function(grade){
	return CharacterManager._getPotionCnt('h', grade);
};
CharacterManager.getMPotionCnt = function(grade){
	return CharacterManager._getPotionCnt('m', grade);
};
/* END CharacterManager */

/**
	ShoppingManager
*/
function ShoppingManager(){
	throw new Error('This is a static class');
}
ShoppingManager.isShopping = false;
ShoppingManager._buyItem = function(item, value, msg){
	if(!Number.isInteger(value)) dt.error("Value is not integer - ._buyItem");
	
	if(ShoppingManager.isShopping) return;
	ShoppingManager.isShopping = true;
	
	buy(item, value)
		.then(function(data){
			game_log(msg);
		})
		.catch(function(data){
			switch(data.reason){
				case "distance":
					GameManager.needReturn = true;
					break;
			}		
		})
		.finally(function(){
			ShoppingManager.isShopping = false;
		});
};
ShoppingManager._buyPotion = function(type, grade, value){
	ShoppingManager._buyItem(
		`${type}pot${grade}`,
		value,
		`Bought ${value} ${type.toUpperCase()}P potion.`
	);
}
ShoppingManager.buyHPotion = async function(grade, value) {
	await ShoppingManager._buyPotion('h', grade, value);
};
ShoppingManager.buyMPotion = async function(grade, value) {
	await ShoppingManager._buyPotion('m', grade, value);
};
ShoppingManager.isEnoughHPotion = function(){
	return CharacterManager.getHPotionCnt(
		GameManager.Potion.HP_GRADE) >= GameManager.Potion.MIN_CNT;
};
ShoppingManager.isEnoughMPotion = function(){
	return CharacterManager.getMPotionCnt(
		GameManager.Potion.MP_GRADE) >= GameManager.Potion.MIN_CNT;
};
ShoppingManager.isEnoughPotion = function(){
	let boolHP = ShoppingManager.isEnoughHPotion();
	let boolMP = ShoppingManager.isEnoughMPotion();
	return boolHP && boolMP;
};
ShoppingManager.refillPotion = function(){
	const hgrade = GameManager.Potion.HP_GRADE;
	const mgrade = GameManager.Potion.MP_GRADE;
	const targetCnt = GameManager.Potion.REFILL_CNT;

	if(!ShoppingManager.isEnoughHPotion()){
		ShoppingManager.buyHPotion(hgrade, 
			targetCnt - CharacterManager.getHPotionCnt(hgrade));
	}
	if(!ShoppingManager.isEnoughMPotion()){
		ShoppingManager.buyMPotion(mgrade, 
			targetCnt - CharacterManager.getMPotionCnt(mgrade));
	}
};
/* END ShoppingManager */

/**
	PartyManager
*/
function PartyManager() {
    throw new Error('This is a static class');
}
PartyManager.INTERVAL_TIME = 10000;
PartyManager.inviteParty = function(name){
	game_log("PartyManager.inviteParty");
	
	let cnt = 0;
	const intervalID = setInterval(function(){
		const state = get_active_characters()[name];
		
		if(state === "code" || state === "active"){
			send_party_invite(name);
		}
		if(PartyManager.isInParty(name)){
			clearInterval(intervalID);
		}
	}, PartyManager.INTERVAL_TIME);
};
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

/**
	ObserverManager
*/
function ObserverManager() {
    throw new Error('This is a static class');
}

ObserverManager.create = function(){
	const right = "100px";
	const top = "175px";
	const width = "450px";
	const height = "269px";
	const btnSize = "16px";
	const borderWidth = "4px";
	const transitionTime = 0.2;
	
	const observerHTML = `
	<div 
		id="L_observer_modal"
		style="
			position: absolute;
			z-index: 99999;
			top: ${top};
			right: ${right};
		"
	>
		<div 
			id="L_close_observer_btn" 
			style="
				position: absolute; z-index: 100; right: 2px; top: 2px;
				width: ${btnSize}; height: ${btnSize}; 
				border-radius: 50%; box-sizing: border-box;
				background: rgb(243,115,53);
				cursor: pointer; 
				transition: all ${transitionTime}s ease-out 0s;
				transform: translate(50%, -50%);
			"
			onclick="
			"
		>
		</div>
		<div 
			id="L_observer_window" 
			style="
				position: absolute; right: 0px; width: ${width}; height: ${height}; 
				background: rgb(0, 0, 0); overflow: hidden;
				border: ${borderWidth} solid; 
				border-image: linear-gradient(45deg, #FDC830, #F37335);
				border-image-slice: 1;
				transition: 
					width ${transitionTime}s ease-out 0s,
					height ${transitionTime}s ease-out 0s;">
			<iframe src="https://adventure.land/comm/" style="
				width: ${width};
				height: ${height};
				opacity: 0.9;
				border: 0;
			"></iframe>
		</div>
	</div>
	`;
	const btnHTML = `
		<div 
			id="L_open_observer_btn"
			class="gamebutton"
			style="
				border-color: #FDC830;
				cursor: pointer;
			"
			onclick="
				if(document.getElementById('L_observer_modal')){
					var el = document.getElementById('L_observer_window'); 
					var btn = document.getElementById('L_close_observer_btn'); 

					if(el.style.width === '0px'){
						el.style.width='${width}';
						el.style.height='${height}';
						// el.style.border='${borderWidth} solid rgb(243, 115, 53)';
						el.style.borderWidth='${borderWidth}';
						btn.style.width='${btnSize}';
						btn.style.height='${btnSize}';
					}else{
						el.style.width='0px';
						el.style.height='0px';
						btn.style.width='0px';
						btn.style.height='0px';
						setTimeout(function(){
							// el.style.border='0px solid rgb(243, 115, 53)';
							el.style.borderWidth='0px';
						}, ${transitionTime * 1000});
					}
				}
			"
		>Observer</div>
	`;
	
	if(!parent.$("#L_open_observer_btn").length){
		parent.$("#toprightcorner .gamebutton")
			.not('.hidden').eq(0)[0].insertAdjacentHTML('beforebegin', btnHTML);
	}	
	if(!parent.$("#L_observer_modal").length){
		parent.$("body").append(observerHTML);
	}
};
/* END ObserverManager */

/**
	GameManager
*/
function GameManager() {
    throw new Error('This is a static class');
}
//////////////////////////////////////////////
// user setting
GameManager.Potion = Object.freeze({
	"HP_GRADE": 0,
	"MP_GRADE": 0,
	"MIN_CNT": 20,
	"REFILL_CNT": 200,
	"HP_USE_RATIO": 0.5,
	"MP_USE_RATIO": 0.3
});
GameManager.Monster = Object.freeze({
	"TARGET_NAME": "bee",
	"MIN_XP": 400,
	"MAX_ATTACK": 200
});
GameManager.Player = Object.freeze({
	main: "WarriorLoL",
	warrior: "WarriorLoL",
	mage: "MageLoL",
	priest: "PriestLoL",
	merchant: "MerchantLoL"
});
GameManager.IS_RESTART = false;
// END user setting
//////////////////////////////////////////////
GameManager.Actions = Object.freeze({
	"HUNTING": 1,
	"SHOPPING": 2,
	"MOVING": 3,
	"RETURN": 4
});
GameManager.checkAction = function(){
	if(GameManager.needReturn)
		return GameManager.Actions.RETURN;
	if(!ShoppingManager.isEnoughPotion()) 
		return GameManager.Actions.SHOPPING;
	if(CharacterManager.isInTown())
		return GameManager.Actions.MOVING;
	if(!CharacterManager.isInBattleArea())
		return GameManager.Actions.MOVING;
	if(!CharacterManager.isCanMoveToTarget())
		return GameManager.Actions.MOVING;
	return GameManager.Actions.HUNTING;
};

GameManager.isMainPlayer = function(){
	return character.id === GameManager.Player.main;
};
GameManager.connectPlayer = function(){	
	GameManager.startPlayer(GameManager.Player.mage, GameManager.Player.main);
	GameManager.startPlayer(GameManager.Player.priest, GameManager.Player.main);
	GameManager.startPlayer(GameManager.Player.merchant);
};
GameManager.startPlayer = function(name, code){
	code = code || name;
	if(!get_active_characters()[name])
		start_character(name, code);
	if(!get_party()[name]) 
		PartyManager.inviteParty(name);
};

GameManager.Action = function(callback){
	return () => {
		callback();
	};
};
GameManager.Tick = Object.freeze({
	hunting: GameManager.Action(function(){
		if(character.ctype === "merchant") return;
		
		set_message("Hunting");
		CharacterManager.Actions.usePotion();
		CharacterManager.Actions.loot();
		CharacterManager.Actions.hunting();
	}),
	shopping: GameManager.Action(function(){
		set_message("Shopping");
		ShoppingManager.refillPotion();
	}),
	moving: GameManager.Action(function(){
		set_message("Smart Moving");
		CharacterManager.smartMove(GameManager.Monster.TARGET_NAME);
	}),
	returning: GameManager.Action(function(){
		set_message("Return Town");
		CharacterManager.returnTown();
	})
});

GameManager.init = function(){
	GameManager.needReturn = false;
	
	change_target(null);
	if(GameManager.isMainPlayer()){
		GameManager.connectPlayer();
		ObserverManager.create();
	}else{
		PartyManager.acceptParty();
	}
};

GameManager.idlePlay = function(){
	setTimeout(async function(){
		const cycleTime = character.ping;
		GameManager.init();
	
		while(true){
			await Util.sleep(cycleTime)
			switch(GameManager.checkAction()){
				case GameManager.Actions.HUNTING:
					GameManager.Tick.hunting();
					break;
				case GameManager.Actions.SHOPPING:
					GameManager.Tick.shopping();
					break;
				case GameManager.Actions.MOVING:
					GameManager.Tick.moving();
					break;
				case GameManager.Actions.RETURN:
					GameManager.Tick.returning();
					break;
				default:
					DevTool.error("unexpected error - GameManager.idlePlay");
					return;
			}
		}
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
