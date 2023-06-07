import {
  BaseEntity,
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import User from "./User";
import Puzzle from "./Puzzle";

@Entity()
export default class Solved_Puzzle extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.solvedPuzzles)
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;

  @OneToOne(() => Puzzle, (puzzle) => puzzle)
  @JoinColumn({ name: "puzzle_id" })
  puzzle: Relation<Puzzle>;

  @Column({ type: "text" })
  result: "solved" | "solved-w-hint" | "failed";

  @Column({ default: 1 })
  attempts: number;

  @Column()
  date: Date;
}
