import { adminService } from '../services/adminService.js';
import { spaceService } from '../services/spaceService.js';

export const adminController = {
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getStats();
      return res.status(200).json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  },

  async getAllUsers(req, res, next) {
    try {
      const users = await adminService.getAllUsers();
      return res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req, res, next) {
    try {
      const userId = Number(req.params.id);
      const user = await adminService.updateUser(userId, req.body);
      return res.status(200).json({ success: true, message: 'Lietotājs veiksmīgi atjaunināts.', data: user });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const userId = Number(req.params.id);
      const result = await adminService.deleteUser(userId);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getAllSpaces(req, res, next) {
    try {
      const spaces = await adminService.getAllSpaces();
      return res.status(200).json({ success: true, count: spaces.length, data: spaces });
    } catch (err) {
      next(err);
    }
  },

  async createSpace(req, res, next) {
    try {
      const space = await spaceService.createSpace(req.body, req.user.user_id);
      return res.status(201).json({ success: true, message: 'Telpa veiksmīgi izveidota.', data: space });
    } catch (err) {
      next(err);
    }
  },

  async updateSpace(req, res, next) {
    try {
      const spaceId = Number(req.params.id);
      const space = await adminService.updateSpace(spaceId, req.body);
      return res.status(200).json({ success: true, message: 'Telpa veiksmīgi atjaunināta.', data: space });
    } catch (err) {
      next(err);
    }
  },

  async deleteSpace(req, res, next) {
    try {
      const spaceId = Number(req.params.id);
      const result = await adminService.deleteSpace(spaceId);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getAllReservations(req, res, next) {
    try {
      const reservations = await adminService.getAllReservations();
      return res.status(200).json({ success: true, count: reservations.length, data: reservations });
    } catch (err) {
      next(err);
    }
  },

  async updateReservationStatus(req, res, next) {
    try {
      const reservationId = Number(req.params.id);
      const { status } = req.body;
      const result = await adminService.updateReservationStatus(reservationId, status);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
