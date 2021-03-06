import {IProjectCard} from '../IProjectCard';
import {Tags} from '../Tags';
import {Card} from '../Card';
import {CardType} from '../CardType';
import {Player} from '../../Player';
import {CardName} from '../../CardName';
import {LogHelper} from '../../LogHelper';
import {Resources} from '../../Resources';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../render/Size';

export class Greenhouses extends Card implements IProjectCard {
  constructor() {
    super({
      cardType: CardType.AUTOMATED,
      name: CardName.GREENHOUSES,
      tags: [Tags.PLANT, Tags.BUILDING],
      cost: 6,

      metadata: {
        cardNumber: '096',
        renderData: CardRenderer.builder((b) => {
          b.plants(1).slash().city(Size.SMALL).any;
        }),
        description: 'Gain 1 plant for each city tile in play.',
      },
    });
  }
  public play(player: Player) {
    const qty = player.game.getCitiesInPlay();
    player.plants += qty;
    LogHelper.logGainStandardResource(player, Resources.PLANTS, qty);
    return undefined;
  }
}
