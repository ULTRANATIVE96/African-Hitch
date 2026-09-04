import { Server, Socket } from "socket.io";

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connected to Socket.io: ${socket.id}`);

    // Join trip room for real-time tracking
    socket.on("join_trip", ({ tripId }: { tripId: string }) => {
      socket.join(`trip_${tripId}`);
      console.log(`📡 Socket ${socket.id} joined trip room trip_${tripId}`);
    });

    // Driver location update broadcast
    socket.on("send_location", ({ tripId, latitude, longitude, speed }: { tripId: string; latitude: number; longitude: number; speed?: number }) => {
      io.to(`trip_${tripId}`).emit("location_update", {
        tripId,
        latitude,
        longitude,
        speed,
        timestamp: Date.now(),
      });
    });

    // Live trip status change broadcast
    socket.on("status_change", ({ tripId, status }: { tripId: string; status: string }) => {
      io.to(`trip_${tripId}`).emit("trip_status_changed", { tripId, status });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}
