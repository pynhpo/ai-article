import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom class-validator constraint that checks whether a string
 * field contains no more than a given number of words.
 *
 * Usage:
 *   @Validate(MaxWordsConstraint, [50_000])
 *   myField: string;
 */
@ValidatorConstraint({ name: 'maxWords', async: false })
export class MaxWordsConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments): boolean {
    if (typeof text !== 'string') return false;
    const maxWords = args.constraints[0] as number;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    return wordCount <= maxWords;
  }

  defaultMessage(args: ValidationArguments): string {
    const maxWords = args.constraints[0] as number;
    return `Text must not exceed ${maxWords.toLocaleString()} words`;
  }
}
