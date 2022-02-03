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
Util.sleep = function(ms = character.ping){ // with await
	return new Promise((resolve) => setTimeout(resolve, ms));
};
/* END Util */

/**
	Delay
*/
function Delay(){
	throw new Error('This is a static class');
}
Delay.add = function(callback, is_await = true){
	Delay[callback.name] = async function(){
		if(is_await){
			await callback.apply(null, arguments);
		}else{
			callback.apply(null, arguments);
		}		
		await Util.sleep(character.ping);
	};
};
Delay.add(equip);
Delay.add(start_character, false);
Delay.add(stop_character);
Delay.add(send_party_request);
Delay.add(send_cm);
/* END Delay */

/**
	ObserverManager
*/
function ObserverManager() {
    throw new Error('This is a static class');
}

ObserverManager.create = function(){
	const right = "20px";
	const top = "165px";
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
				width: ${"0px"}; height: ${"0px"}; 
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
				position: absolute; right: 0px; width: ${"0px"}; height: ${"0px"}; 
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
	CharacterManager
*/
function CharacterManager() {
    throw new Error('This is a static class');
}
//////////////////////////////////////////////
// user setting
CharacterManager.Equipment = Object.freeze({
	ring1: "ringsj",
	ring2: "ringsj",
	earring1: null,
	earring2: null,
	belt: "hpbelt",
	mainhand: Object.freeze({
		warrior: "blade",
		mage: null,
		priest: null
	}),
	offhand: Object.freeze({
		warrior: "wshield",
		mage: null,
		priest: null
	}),
	helmet: "helmet",
	chest: "coat",
	pants: "pants",
	shoes: "shoes",
	gloves: "gloves",
	amulet: "hpamulet",
	orb: "test_orb",
	elixir: null,
	cape: null
});
// END user setting
//////////////////////////////////////////////
CharacterManager.Skills = Object.freeze({
	Date: {}
});
CharacterManager.Actions = Object.freeze({
	loot: () => loot(),
	hunting: async function(){
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
			await CharacterManager.useSkill("attack", target);
		}
	},
	usePotion: async function(){
		if(character.hp / character.max_hp < GameManager.Potion.HP_USE_RATIO) 
			await CharacterManager.useHPotion();
		if(character.mp / character.max_mp < GameManager.Potion.MP_USE_RATIO)
			await CharacterManager.useMPotion();
	}
});

CharacterManager.smartMove = async function(dest){
	if(!is_moving(character)){
		await smart_move({to: dest});
	}
};
CharacterManager.getTargetMonster = function(type){
	return get_nearest_monster({
		min_xp: GameManager.Monster.MIN_XP, 
		max_att: GameManager.Monster.MAX_ATTACK,
		type: type
	});
};
CharacterManager.isSkillCooldown = function(skill){
	if(!G.skills[skill]) return true;
	
	const elapsedTime = Util.getElapsedTime(CharacterManager.Skills.Date[skill]);
	return elapsedTime < G.skills[skill].cooldown;
};

CharacterManager.isInBattleArea = function(){
	const monster = 
		 CharacterManager.getTargetMonster(GameManager.Monster.TARGET_NAME);
	return !!monster;
};
CharacterManager.isInTown = function(){
	return Math.abs(character.x) < 200 && Math.abs(character.y) < 200;
};
CharacterManager.isOnCooldown = function(skill){
	return is_on_cooldown(skill) || CharacterManager.isSkillCooldown(skill);
};
CharacterManager.isCanMoveToTarget = function(target){
	target = target || get_targeted_monster();
	return target ? can_move_to(target) : true;
};

CharacterManager.useSkill = function(skill, target, extra_arg){
	if(!G.skills[skill]) return false;
	
	return new Promise(async (resolve) => {
		if(!CharacterManager.isOnCooldown(skill)){
			set_message(`S - ${skill}`);

			switch(skill){
				case "attack":
					attack(target).then(
						function(data){
							CharacterManager.Skills.Date[skill] = new Date();
						},
						function(data){
							game_log("oh no, attack failed: " + data.reason);
						},
					).finally(resolve);
					break;
				default:
					await use_skill(skill);
					CharacterManager.Skills.Date[skill] = new Date();
					resolve();
					break;
			}
		}
	});
};
CharacterManager._usePotion = async function(type){
	const skill = `use_${type}p`;
	if(!CharacterManager.isOnCooldown(skill)){
		await CharacterManager.useSkill(skill);
		game_log(`use ${type.toUpperCase()}P potion`);
	}
};
CharacterManager.useHPotion = async function(){
	await CharacterManager._usePotion('h');
};
CharacterManager.useMPotion = async function(){
	await CharacterManager._usePotion('m');
};
CharacterManager.returnTown = function(){
	if(CharacterManager.isInTown()){
		GameManager.needReturn = false;
		stop("smart", 0);
	}else{
		use_skill("use_town");
		CharacterManager.smartMove("town");
	}
};

CharacterManager.getItem = function(name){
	return character.items.find(x => x && x.name === name);	
}
CharacterManager.getItemCnt = function(name){
	const item = CharacterManager.getItem(name);
	return item? item.q : 0;
}
CharacterManager._getPotionCnt = function(type, grade = 0){
	return CharacterManager.getItemCnt(`${type}pot${grade}`);
};
CharacterManager.getHPotionCnt = function(grade){
	return CharacterManager._getPotionCnt('h', grade);
};
CharacterManager.getMPotionCnt = function(grade){
	return CharacterManager._getPotionCnt('m', grade);
};

CharacterManager.getBestItem = function(name){ // return [item, index];
	return character.items.reduce((acc, cur, idx) => {
		if(cur !== null && cur.name === name){
			if(acc[0] === null){
				return [cur, idx];	
			}else if(cur.level !== undefined && cur.level > acc[0].level){
				return [cur, idx];
			}
		}
		return acc;
	}, [null, -1]);
};
CharacterManager.getEquipmentNameAll = function(){
	const result = [];
	const keys = Object.keys(CharacterManager.Equipment);
	
	for(let i=0; i<keys.length; i++){
		const key = keys[i];
		const value = CharacterManager.Equipment[key];
		let name = null;
		
		switch(key){
			case "mainhand":
			case "offhand":
				if(value && value[character.ctype]) name = value[character.ctype];
				break;
			default:
				if(value) name = value;
				break;				
		}		
		result[i] = name;
	};
	
	return result;
};
CharacterManager.getEquipmentName = function(){
	
}

CharacterManager.getItemMaxLevel = function(name){
	const itemMaxLevel = character.items.reduce((acc, cur) => {
		if(cur !== null && cur.name === name && acc < cur.level)
			return cur.level;
		return acc;
	}, -1);
	const equipMaxLevel = 
		  CharacterManager.getEquipmentLevel(G.items[name].type);
	
	return Math.max(itemMaxLevel, equipMaxLevel);
};
CharacterManager.getEquipmentLevel = function(type){
	const fx = CharacterManager.getEquipmentLevel;
	
	if(type === "ring"){
		return Math.max(fx("ring1"), fx("ring2"));
	}else if(type === "earring"){
		return Math.max(fx("earring1"), fx("earring2"));
	}else{
		const item = character.slots[type];
		return item === null? -1 : item.level;
	}	
};

CharacterManager.equip = async function(name){
	if(!name) return;	
	
	const [bestItem, idx] = CharacterManager.getBestItem(name);
	if(bestItem !== null){
		const equipedItem = character.slots[G.items[name].type];
		if(!equipedItem){
			await Delay.equip(idx);
		}else if(equipedItem.level !== undefined &&
				 equipedItem.level < bestItem.level){
			await Delay.equip(idx);
		}
	}
};
CharacterManager.equipAll = async function(){
	const names = CharacterManager.getEquipmentNameAll();
	for(let i=0; i<names.length; i++){
		await CharacterManager.equip(names[i]);	
	}
};
CharacterManager.upgradeEquipment = async function(name, level){	
	if(CharacterManager.getItemMaxLevel(name) >= level) return;
	
	let result;
	do{
		result = await UpgradeManager.upgrade(name);
		if(result.reason) return false;
	}while(result.level < level || result.failed);
	await CharacterManager.equip(name);
}
CharacterManager.upgradeEquipmentAll = function(level){
	CharacterManager.upgradeEquipment;
}

/* END CharacterManager */

/**
	UpgradeManager
*/
function UpgradeManager(){
	throw new Error('This is a static class');
}
UpgradeManager.UPGRADE_TYPE = [
	"mainhand", "offhand", "helment", "chest", "pants", "shoes", "gloves"	
];
UpgradeManager.COMPOUND_TYPE = [
	"ring1", "ring2", "belt", "amulet", "gloves"	
];

UpgradeManager.isUpgradeType = function(type){
	return UpgradeManager.UPGRADE_TYPE.indexOf(type) >= 0;
};
UpgradeManager.isCompoundType = function(type){
	return UpgradeManager.COMPOUND_TYPE.indexOf(type) >= 0;
};

UpgradeManager.wait = async function(name){
	while(character.q.upgrade) Util.sleep();
}
UpgradeManager.upgrade = async function(name){
	if(G.items[name] && UpgradeManager.isUpgradeType(G.items[name].type)){
		let [item, itemIdx] = CharacterManager.getBestItem(name);
		
		if(item === null){
			itemIdx = await ShoppingManager.buyItem(name);
			if(itemIdx < 0) return { reason: "not_buy_item" };
			item = character.items[itemIdx];
		}
		
		const grade = item_grade(item);
		const scrollName = "scroll" + grade;
		let scrollIdx = locate_item(scrollName);
		
		if(scrollIdx < 0){
			scrollIdx = await ShoppingManager.buyItem(scrollName);
			if(scrollIdx < 0) return { reason: "not_buy_scroll" };
		}		
		if(character.q.upgrade){
			await UpgradeManager.wait();
		}
		if(!character.q.upgrade){
			return new Promise((resolve) => {
				upgrade(itemIdx, scrollIdx).then(
					function(data){
						resolve(data);
					},
					function(data){
						resolve(data);
					},
				);
			});
		}
	}	
	return { reason: "not_exist_item" };
};
UpgradeManager.compound = function(name){
	
};
/* END UpgradeManager */

/**
	ShoppingManager
*/
function ShoppingManager(){
	throw new Error('This is a static class');
}
ShoppingManager.buyItem = function(item, value = 1, msg){ // return index;
	if(!Number.isInteger(value)) dt.error("Value is not integer - ._buyItem");
	
	return new Promise((resolve) => {
		buy(item, value)
			.then(function(data){
				if(msg) game_log(msg);
				resolve(data.num);
			})
			.catch(function(data){
				switch(data.reason){
					case "distance":
						GameManager.setNeedReturn(true);
						break;
				}
				resolve(-1);
			});
	});
};
ShoppingManager._buyPotion = async function(type, grade, value){
	await ShoppingManager.buyItem(
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
	const boolHP = ShoppingManager.isEnoughHPotion();
	const boolMP = ShoppingManager.isEnoughMPotion();
	return boolHP && boolMP;
};
ShoppingManager.refillPotion = async function(){
	const hgrade = GameManager.Potion.HP_GRADE;
	const mgrade = GameManager.Potion.MP_GRADE;
	const targetCnt = GameManager.Potion.REFILL_CNT;

	if(!ShoppingManager.isEnoughHPotion()){
		await ShoppingManager.buyHPotion(hgrade, 
			targetCnt - CharacterManager.getHPotionCnt(hgrade));
	}
	if(!ShoppingManager.isEnoughMPotion()){
		await ShoppingManager.buyMPotion(mgrade, 
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
PartyManager.acceptParty = function(name){
	dt.log("acceptParty");
	const intervalID = setInterval(() => {
		if(!PartyManager.isInParty(name)){
			accept_party_request(name);	
		}
		if(PartyManager.isInParty(name)){
			clearInterval(intervalID);
		}
	}, PartyManager.INTERVAL_TIME);
};
PartyManager.requestParty = async function(){
	dt.log("requestParty");
	await Delay.send_party_request(GameManager.Player.main);
	await Delay.send_cm(
		GameManager.Player.main, GameManager.Code.PARTY_REQUEST);
};
PartyManager.isInParty = function(name){
	name = name || character.name;
	return !!get_party()[name];
};

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
Object.defineProperties(GameManager, {
	IS_RESTART: { value: false },
	IS_ALONE: { value: false },
});
// END user setting
//////////////////////////////////////////////
GameManager.PING = Math.max(character.ping, 200);
GameManager.Actions = Object.freeze({
	"HUNTING": 1,
	"SHOPPING": 2,
	"MOVING": 3,
	"RETURN": 4,
	"RESPAWN": 5
});
GameManager.checkAction = function(){
	if(character.rip)
	   return GameManager.Actions.RESPAWN;
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

GameManager.Code = Object.freeze({
	PARTY_REQUEST: "party_request"
});
GameManager.handleCodeMessage = function(){
	character.on("cm",function(m){
		if(GameManager.isPlayer(m.name)){
			switch(m.message){
				case GameManager.Code.PARTY_REQUEST:
					PartyManager.acceptParty(m.name);
					break;
			}
		}
	});
};

GameManager.isMainPlayer = function(){
	return character.id === GameManager.Player.main;
};
GameManager.isPlayer = function(name){
	return Object.values(GameManager.Player).indexOf(name) >= 0;
};
GameManager.connectPlayer = async function(){
	const mainPlayer = GameManager.Player.main;
	await GameManager.startPlayer(GameManager.Player.merchant);
	if(!GameManager.IS_ALONE){
		await GameManager.startPlayer(GameManager.Player.mage, mainPlayer);
		await GameManager.startPlayer(GameManager.Player.priest, mainPlayer);	
	}
};
GameManager.startPlayer = async function(name, code){
	code = code || name;
	
	if(GameManager.IS_RESTART && get_active_characters()[name]){
		await GameManager.stopPlayer(name);
	}	
	if(!get_active_characters()[name]){
		await Delay.start_character(name, code);
	}
};
GameManager.stopPlayer = async function(name){
	while( get_active_characters()[name] ){
		await Delay.stop_character(name);
		await Util.sleep();
	}
};
GameManager.setNeedReturn = function(bool){
	GameManager.needReturn = bool;
};
GameManager.isNeedReturn = function(){
	return GameManager.needReturn;
}

GameManager.Action = function(callback){
	return async () => {
		await callback();
	};
};
GameManager.Tick = Object.freeze({
	hunting: GameManager.Action(async function(){
		if(character.ctype === "merchant") return;
		
		set_message("Hunting");
		await CharacterManager.Actions.usePotion();
		await CharacterManager.Actions.loot();
		await CharacterManager.Actions.hunting();
	}),
	shopping: GameManager.Action(async function(){
		set_message("Shopping");
		await ShoppingManager.refillPotion();
	}),
	moving: GameManager.Action(async function(){
		set_message("Smart Moving");
		await CharacterManager.smartMove(GameManager.Monster.TARGET_NAME);
	}),
	returning: GameManager.Action(async function(){
		set_message("Return Town");
		await CharacterManager.returnTown();
	}),
	respawn: GameManager.Action(async function(){
		set_message("Respawn");
		await respawn();
	})
});

GameManager.init = async function(){
	change_target(null);	
	GameManager.setNeedReturn(false);
	await CharacterManager.equipAll();	
	
	if(!GameManager.isMainPlayer()){
		PartyManager.requestParty();
	}else{
		GameManager.handleCodeMessage();
		GameManager.connectPlayer();
		ObserverManager.create();
	}
};

GameManager.idlePlay = function(){
	setTimeout(async function(){
		await GameManager.init();
	
		while(true){
			await Util.sleep(GameManager.PING);
			switch(GameManager.checkAction()){
				case GameManager.Actions.HUNTING:
					await GameManager.Tick.hunting();
					break;
				case GameManager.Actions.SHOPPING:
					await GameManager.Tick.shopping();
					break;
				case GameManager.Actions.MOVING:
					await GameManager.Tick.moving();
					break;
				case GameManager.Actions.RETURN:
					await GameManager.Tick.returning();
					break;
				case GameManager.Actions.RESPAWN:
					await GameManager.Tick.respawn();
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
// GameManager.idlePlay();
CharacterManager.upgradeEquipment("coat", 7);


/* END Main */

// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland
