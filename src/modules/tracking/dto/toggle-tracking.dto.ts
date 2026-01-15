import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class ToggleTrackingDto {
  @IsString()
  @IsNotEmpty()
  habitId: string;

  @IsDateString()
  @IsNotEmpty()
  completedDate: string;

  @IsBoolean()
  checked: boolean;
}

