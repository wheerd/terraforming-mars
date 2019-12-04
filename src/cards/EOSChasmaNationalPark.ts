
import {IProjectCard} from './IProjectCard';
import {Tags} from './Tags';
import {CardType} from './CardType';
import {Player} from '../Player';
import {Game} from '../Game';
import {SelectCard} from '../inputs/SelectCard';

export class EosChasmaNationalPark implements IProjectCard {
  public cost: number = 16;
  public nonNegativeVPIcon: boolean = true;
  public tags: Array<Tags> = [Tags.PLANT, Tags.STEEL];
  public name: string = 'Eos Chasma National Park';
  public cardType: CardType = CardType.AUTOMATED;
  public canPlay(player: Player, game: Game): boolean {
    return game.getTemperature() >= -12 - (
      2 * player.getRequirementsBonus(game)
    );
  }
  public play(player: Player, game: Game) {
    const availableCards = game.getPlayedCardsWithAnimals();
    return new SelectCard(
        'Select card to add 1 animal',
        availableCards,
        (foundCards: Array<IProjectCard>) => {
          player.addResourceTo(foundCards[0]);
          player.plants += 3;
          player.megaCreditProduction += 2;
          player.victoryPoints++;
          return undefined;
        }
    );
  }
}
