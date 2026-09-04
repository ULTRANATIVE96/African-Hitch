import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCurrentUser, useUpdateProfile } from "@/lib/api-hooks";
import { AvatarPicker, OnboardingShell, TextField } from "./onboarding.hiker";

export const Route = createFileRoute("/onboarding/driver")({
  head: () => ({ meta: [{ title: "Driver onboarding" }] }),
  component: DriverOnboarding,
});

function DriverOnboarding() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [plate, setPlate] = useState("");
  const [seats, setSeats] = useState("4");
  const [avatar, setAvatar] = useState(user?.avatar ?? "🧑🏾‍✈️");
  const [vehiclePhoto, setVehiclePhoto] = useState("🚗");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <OnboardingShell
      title="Welcome, driver"
      sub="Hikers need to see your face, your vehicle and your number plate."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile.mutate({ phone, avatar, vehicle, plate, vehiclePhoto, seats: Number(seats) });
          navigate({ to: "/feed" });
        }}
        className="space-y-4"
      >
        <AvatarPicker value={avatar} onChange={setAvatar} />
        <TextField label="Phone" value={phone} onChange={setPhone} placeholder="+27 ..." />
        <TextField
          label="Vehicle (make & model)"
          value={vehicle}
          onChange={setVehicle}
          placeholder="Toyota Quantum"
        />
        <TextField label="Number plate" value={plate} onChange={setPlate} placeholder="BPL 421 L" />
        <div>
          <span className="mb-2 block text-xs font-medium text-muted-foreground">
            Vehicle photo (photo upload coming soon)
          </span>
          <div className="flex flex-wrap gap-2">
            {["🚗", "🚐", "🛻", "🚙", "🚌"].map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setVehiclePhoto(o)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl ${
                  vehiclePhoto === o ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <TextField label="Seats available" value={seats} onChange={setSeats} type="number" />
        <button className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground">
          Finish & enter app
        </button>
      </form>
    </OnboardingShell>
  );
}
