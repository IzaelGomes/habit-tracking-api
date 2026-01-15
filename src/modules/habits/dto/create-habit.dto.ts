import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateHabitDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one weekday must be selected' })
  @IsInt({ each: true, message: 'Each weekday must be an integer' })
  @Min(0, { each: true, message: 'Weekday must be between 0 (Monday) and 6 (Sunday)' })
  @Max(6, { each: true, message: 'Weekday must be between 0 (Monday) and 6 (Sunday)' })
  weekDays: number[];

  @IsDateString()
  @IsNotEmpty()
  createdAt: string;
}

