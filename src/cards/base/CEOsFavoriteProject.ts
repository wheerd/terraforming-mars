import {ICard} from '../ICard';
import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardType} from '../CardType';
import {Player} from '../../Player';
import {SelectCard} from '../../inputs/SelectCard';
import {CardName} from '../../CardName';
import {LogHelper} from '../../LogHelper';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../render/Size';

export class CEOsFavoriteProject extends Card implements IProjectCard {
  constructor() {
    super({
      cardType: CardType.EVENT,
      name: CardName.CEOS_FAVORITE_PROJECT,
      cost: 1,

      metadata: {
        cardNumber: '149',
        renderData: CardRenderer.builder((b) => b.text('Add 1 resource to a card with at least 1 resource on it', Size.SMALL, true)),
      },
    });
  }
  public canPlay(player: Player): boolean {
    return player.getCardsWithResources().length > 0 ||
           player.getSelfReplicatingRobotsTargetCards().length > 0;
  }

  public play(player: Player) {
    const robotCards = player.getSelfReplicatingRobotsTargetCards();
    return new SelectCard(
      'Select card to add resource',
      'Add resource',
      player.getCardsWithResources().concat(robotCards.map((c) => c.card)),
      (foundCards: Array<ICard>) => {
        player.addResourceTo(robotCards.find((c) => c.card.name === foundCards[0].name) ?? foundCards[0]);
        LogHelper.logAddResource(player, foundCards[0]);
        return undefined;
      },
    );
  }
}

