import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CaretLeft, Camera, CheckCircle, Trash } from "@phosphor-icons/react";
import clsx from "clsx";
import { carsApi } from "../lib/cars";
import { uploadImage, resolveImageUrl, ApiError } from "../lib/api";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import { PageFade } from "../components/ui/PageFade";
import type { Car, CarInput } from "../types/car";

const DRIVETRAINS = ["FWD", "RWD", "AWD"];

export function CarFormPage() {
  const { carId } = useParams<{ carId: string }>();
  const isEditing = Boolean(carId);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [car, setCar] = useState<Car | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [form, setForm] = useState<CarInput>({ name: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) return;
    carsApi
      .list()
      .then((cars) => {
        const found = cars.find((c) => c.id === carId);
        if (found) {
          setCar(found);
          setPhotoUrl(found.photoUrl ?? undefined);
          setForm({
            name: found.name,
            make: found.make ?? undefined,
            model: found.model ?? undefined,
            year: found.year ?? undefined,
            color: found.color ?? undefined,
            engineType: found.engineType ?? undefined,
            drivetrain: found.drivetrain ?? undefined,
            horsepowerHp: found.horsepowerHp ?? undefined,
            torqueNm: found.torqueNm ?? undefined,
            weightKg: found.weightKg ?? undefined,
            topSpeedKmh: found.topSpeedKmh ?? undefined,
            zeroToHundredSec: found.zeroToHundredSec ?? undefined,
          });
        }
      })
      .catch(() => setError("Could not load this car's details"));
  }, [carId]);

  function field<K extends keyof CarInput>(key: K, value: string) {
    if (value === "") {
      setForm((f) => ({ ...f, [key]: undefined }));
      return;
    }
    const numericKeys: (keyof CarInput)[] = [
      "year",
      "horsepowerHp",
      "torqueNm",
      "weightKg",
      "topSpeedKmh",
      "zeroToHundredSec",
    ];
    setForm((f) => ({ ...f, [key]: numericKeys.includes(key) ? Number(value) : value }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setError(null);
    try {
      const { url } = await uploadImage(file);
      setPhotoUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload photo");
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Give your car a name");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const payload = { ...form, photoUrl };
      if (isEditing && carId) {
        await carsApi.update(carId, payload);
      } else {
        await carsApi.create(payload);
      }
      navigate("/garage");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this car");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivate() {
    if (!carId) return;
    setError(null);
    try {
      await carsApi.activate(carId);
      navigate("/garage");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not activate this car");
    }
  }

  async function handleDelete() {
    if (!carId) return;
    setError(null);
    try {
      await carsApi.remove(carId);
      navigate("/garage");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this car");
    }
  }

  return (
    <PageFade className="safe-top safe-bottom flex flex-col gap-5 px-5 pt-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/garage")} aria-label="Back">
          <CaretLeft size={22} className="text-text-muted" />
        </button>
        <h1 className="text-2xl font-semibold text-text">{isEditing ? "Edit car" : "Add a car"}</h1>
      </div>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploadingPhoto}
        className="glass relative flex h-40 items-center justify-center overflow-hidden rounded-card"
      >
        {photoUrl ? (
          <img src={resolveImageUrl(photoUrl)} alt="Car" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <Camera size={26} />
            <span className="text-[13px]">{isUploadingPhoto ? "Uploading..." : "Add a cover photo"}</span>
          </div>
        )}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      <GlassCard className="flex flex-col gap-3">
        <Input label="Name" placeholder="The Beast" value={form.name} onChange={(e) => field("name", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Make" placeholder="Honda" value={form.make ?? ""} onChange={(e) => field("make", e.target.value)} />
          <Input label="Model" placeholder="Civic Type R" value={form.model ?? ""} onChange={(e) => field("model", e.target.value)} />
          <Input label="Year" type="number" value={form.year ?? ""} onChange={(e) => field("year", e.target.value)} />
          <Input label="Color" placeholder="Championship White" value={form.color ?? ""} onChange={(e) => field("color", e.target.value)} />
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col gap-3">
        <span className="text-[13px] font-medium text-text-muted">Specs</span>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text-muted">Drivetrain</span>
          <div className="glass flex rounded-button p-1">
            {DRIVETRAINS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm((f) => ({ ...f, drivetrain: d }))}
                className={clsx(
                  "flex-1 rounded-button py-2 text-[13px] font-medium transition-colors",
                  form.drivetrain === d ? "bg-accent text-accent-foreground" : "text-text-muted"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <Input label="Engine type" placeholder="2.0L Turbo I4" value={form.engineType ?? ""} onChange={(e) => field("engineType", e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Horsepower (hp)" type="number" value={form.horsepowerHp ?? ""} onChange={(e) => field("horsepowerHp", e.target.value)} />
          <Input label="Torque (Nm)" type="number" value={form.torqueNm ?? ""} onChange={(e) => field("torqueNm", e.target.value)} />
          <Input label="Weight (kg)" type="number" value={form.weightKg ?? ""} onChange={(e) => field("weightKg", e.target.value)} />
          <Input label="Top speed (km/h)" type="number" value={form.topSpeedKmh ?? ""} onChange={(e) => field("topSpeedKmh", e.target.value)} />
          <Input label="0-100 km/h (s)" type="number" step="0.1" value={form.zeroToHundredSec ?? ""} onChange={(e) => field("zeroToHundredSec", e.target.value)} />
        </div>
      </GlassCard>

      <Button size="lg" fullWidth disabled={isSaving} onClick={handleSave}>
        {isSaving ? "Saving..." : "Save car"}
      </Button>

      {isEditing && (
        <>
          {!car?.isActive && (
            <Button variant="glass" icon={<CheckCircle size={18} />} onClick={handleActivate}>
              Set as active car
            </Button>
          )}
          <Button variant="danger" icon={<Trash size={18} />} onClick={handleDelete}>
            Delete car
          </Button>
        </>
      )}
    </PageFade>
  );
}
