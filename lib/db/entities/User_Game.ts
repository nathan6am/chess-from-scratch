import {
  BaseEntity,
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Color } from "@/lib/chess";
import type { Relation } from "typeorm";
import User from "./User";
import Game from "./Game";

@Entity()
export default class User_Game extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.games)
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;

  @ManyToOne(() => Game, (game) => game.players)
  @JoinColumn({ name: "game_id", referencedColumnName: "id" })
  game: Relation<Game>;

  @Column({ type: "text" })
  color: Color;

  @Column({ type: "text" })
  result: "win" | "loss" | "draw";

  @Column({ nullable: true })
  rating: number;
}
