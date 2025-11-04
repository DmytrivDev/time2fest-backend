import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("user_schedules")
export class UserSchedule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // 👇 ЗМІНА ТУТ — було type: 'uuid'
  @Column({ type: "int", unique: true })
  user_id!: number;

  @Column({ type: "jsonb", default: [] })
  countries!: any[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
