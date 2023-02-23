import {
  BaseEntity,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  ILike,
} from "typeorm";
import type { Relation } from "typeorm";
import User from "./User";

@Entity()
export default class User_Game extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  pgn: string;

  @OneToOne(() => User, (user) => user.id)
  author: Relation<User>;
}
