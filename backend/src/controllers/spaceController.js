import { spaceService } from '../services/spaceService.js';

export const spaceController = {
  async listSpaces(req, res, next) {
    try {
      const spaces = await spaceService.listSpaces(req.spaceFilters);
      return res.status(200).json({
        success: true,
        spaces,
        pagination: {
          limit: req.spaceFilters.limit,
          offset: req.spaceFilters.offset,
          count: spaces.length,
        },
      });
    } catch (err) {
      console.error('Telpu saraksta iegūšanas kļūda:', err);
      // Klientam neatklāj SQL vaicājumus vai datubāzes kļūdu detaļas.
      next(new Error('Neizdevās iegūt telpu sarakstu.'));
    }
  },

  featuredSpaces(req, res) {
    return res.status(501).json({
      success: false,
      message: 'Izcelto telpu atlasei jāsaskaņo izcelšanas vai popularitātes kritērijs.',
    });
  },

  listCities(req, res) {
    return res.status(501).json({
      success: false,
      message: 'Pilsētu sarakstam jāsaskaņo atsevišķs city lauks datubāzē.',
    });
  },
};
