import { IsNotEmpty, IsString } from 'class-validator';
import { MaxWordsConstraint } from './validators/max-words.validator';
import { Validate } from 'class-validator';

const MAX_ROUGH_NOTES_WORDS = 50_000;

export class GenerateTravelArticleDto {
  @IsString()
  @IsNotEmpty({ message: 'roughNotes is required' })
  @Validate(MaxWordsConstraint, [MAX_ROUGH_NOTES_WORDS], {
    message: `roughNotes must not exceed ${MAX_ROUGH_NOTES_WORDS.toLocaleString()} words`,
  })
  roughNotes: string;
}
