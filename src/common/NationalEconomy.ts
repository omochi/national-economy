import { Subject } from "rx";
import * as _ from "lodash";

import { Message, MessageType } from "./Message";
import { Json } from "./Json";

export class NationalEconomyMessage implements Message {
	type(): MessageType { return NationalEconomyMessage; }
	static key(): string { return "NE"; }

	constructor(public event: RoomEvent) {}

	toJson(): Json {
		return Json.object({
			"type": Json.string(this.event.type().key()),
			"event": this.event.toJson()
		});
	}
	static fromJson(json: Json): NationalEconomyMessage {
		const type = json.queryKey("type").string();
		const event = NationalEconomyMessage.decoder.decode(type, json.queryKey("event"));
		return new NationalEconomyMessage(event);
	}

	static decoder = new RoomEventDecoder();
}

export class RoomEventDecoder {

	constructor() {
		this.register(AddPlayerRoomEvent);
	}
	register(type: RoomEventType) {
		this.table_[type.key()] = (json: Json) => { return type.fromJson(json); }
	}
	decode(type: string, json: Json): RoomEvent {
		const decode = this.table_[type];
		if (decode == null) {
			throw new Error(`unknown type ${type}`);
		}
		return decode(json);
	}
	private table_: { [key: string]: (json: Json) => RoomEvent };
}

export interface RoomEvent {
	type(): RoomEventType;
	toJson(): Json;
}
export interface RoomEventType {
	key(): string;
	fromJson(json: Json): RoomEvent;
}

export class RoomSnapshotEvent implements RoomEvent {
	type(): RoomEventType { return RoomSnapshotEvent; }
	static key(): string { return "RoomSnapshot"; }

	constructor(public room: Room) {}

	toJson(): Json {
		return Json.object({
			"room": this.room.toJson()
		});
	}
	static fromJson(json: Json): RoomSnapshotEvent {
		return new RoomSnapshotEvent(
			Room.fromJson(json.queryKey("room"))
			);
	}
}

export class AddPlayerEvent implements RoomEvent {
	type(): RoomEventType { return AddPlayerEvent; }
	static key(): string { return "AddPlayer"; }

	constructor(public player: Player) {}

	toJson(): Json {
		return Json.object({
			"player": this.player.toJson() 
		});
	}
	static fromJson(json: Json): AddPlayerEvent {
		return new AddPlayerEvent(
			Player.fromJson(json.queryKey("player"))
			);
	}
}
export class RemovePlayerEvent implements RoomEvent {
	type(): RoomEventType { return RemovePlayerEvent; }
	static key(): string { return "RemovePlayer"; }

	constructor(public playerId: number) {}

	toJson(): Json {
		return Json.object({
			"playerId": Json.number(this.playerId)
		});
	}
	static fromJson(json: Json): RemovePlayerEvent {
		return new RemovePlayerEvent(
			json.queryKey("playerId").number());
	}
}

export class Room {
	constructor() {
		this.events_ = new Subject<RoomEvent>();
		this.players_ = [];
		this.lastPlayerId_ = 0;
	}

	players(): Player[] {
		return this.players_;
	}
	addPlayer(player: Player) {
		this.players_.push(player);
		this.sendEvent(new AddPlayerEvent(player));
	}
	removePlayer(player: Player) {
		_.remove(this.players_, x => { return x == player; });
		this.sendEvent(new RemovePlayerEvent(player.id()));
	}

	createPlayer(): Player {
		const id = this.lastPlayerId_ + 1;
		this.lastPlayerId_ = id;

		return new Player(id);
	}

	applyEvent(e: RoomEvent) {
		const e1 = e as AddPlayerEvent;
		if (e1 != null) {
			this.addPlayer(e1.player);
		}
	}

	toJson(): Json {
		return Json.object({
			"players": Json.encodeArray(this.players_, x => { return x.toJson() })
		});
	}

	static fromJson(json: Json): Room {
		const room = new Room();
		room.players_ = json.queryKey("players").decodeArray(x => { return Player.fromJson(x); });
		return room;
	}

	private sendEvent(event: RoomEvent) {
		this.events_.onNext(event);
	}
	private events_: Subject<RoomEvent>;

	private players_: Player[];
	private lastPlayerId_: number;
}

export class Player {

	constructor(
		id: number) 
	{
		this.id_ = id;
		this.nickname_ = "";
	}

	id(): number {
		return this.id_;
	}
	nickname(): string {
		return this.nickname_;
	}
	setNickname(value: string) {
		this.nickname_ = value;
	}


	toJson(): Json {
		return Json.object({
			"id": Json.number(this.id()),
			"nickname": Json.string(this.nickname())
		});
	}
	static fromJson(json: Json): Player {
		const player = new Player(
			json.queryKey("id").number());
		player.setNickname(json.queryKey("nickname").string());
		return player;
	}

	private id_: number;
	private nickname_: string;
}

