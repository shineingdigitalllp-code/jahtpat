"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Hash, Landmark, LocateFixed, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ADDRESS_LABELS, addressSchema, type Address } from "@jhatpat/shared";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { apiSend, ApiError } from "@/lib/api";

type AddressValues = z.input<typeof addressSchema>;

type AddressFormProps = { address?: Address; next: string; autoLocate?: boolean };

export function AddressForm({ address, next, autoLocate = false }: AddressFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues, unknown, z.output<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: (address?.label as AddressValues["label"] | undefined) ?? "Home",
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "Kota",
      state: address?.state ?? "Rajasthan",
      pincode: address?.pincode ?? "",
      isDefault: address?.isDefault ?? false,
    },
  });
  const label = watch("label");
  const { locate, locating, error: locationError } = useCurrentLocation();
  const [located, setLocated] = useState(false);
  const autoLocated = useRef(false);

  const fillFromLocation = async () => {
    setLocated(false);
    const detected = await locate();
    if (!detected) return;
    const options = { shouldDirty: true, shouldValidate: true };
    for (const field of ["line2", "city", "state", "pincode"] as const) {
      if (detected[field]) setValue(field, detected[field], options);
    }
    setValue("lat", detected.lat);
    setValue("lng", detected.lng);
    setLocated(true);
    setFocus("line1");
  };

  useEffect(() => {
    if (!autoLocate || autoLocated.current) return;
    autoLocated.current = true;
    void fillFromLocation();
  });

  const submit = async (values: z.output<typeof addressSchema>) => {
    setFormError(null);
    try {
      await (address ? apiSend(`/addresses/${address.id}`, "PUT", values) : apiSend("/addresses", "POST", values));
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      router.replace(next);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3 px-4">
      <div>
        <Button variant="outline" size="lg" className="w-full" pending={locating} onClick={fillFromLocation}>
          {!locating && <LocateFixed aria-hidden className="size-5" />}
          {locating ? "Detecting your location" : "Use my current location"}
        </Button>
        <p aria-live="polite" className="mt-1.5 px-1 text-xs font-medium">
          {locationError && <span className="text-danger">{locationError}</span>}
          {located && <span className="text-positive">Location found. Add your house or flat number below.</span>}
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 px-1 text-xs font-bold tracking-wider text-muted uppercase">Save address as</legend>
        <div className="flex gap-2">
          {ADDRESS_LABELS.map((option) => (
            <Chip
              key={option}
              pressed={label === option}
              onClick={() => setValue("label", option, { shouldDirty: true })}
              className="px-5"
            >
              {option}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Input
        label="House / Flat / Floor and Building"
        icon={Building2}
        iconColor="orange"
        placeholder="e.g. 12, Shanti Apartments"
        autoComplete="address-line1"
        error={errors.line1?.message}
        {...register("line1")}
      />
      <Input
        label="Area / Street / Landmark (optional)"
        icon={Landmark}
        iconColor="gray"
        placeholder="e.g. Near City Mall, Talwandi"
        autoComplete="address-line2"
        error={errors.line2?.message}
        {...register("line2")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="City" placeholder="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
        <Input label="State" placeholder="State" autoComplete="address-level1" error={errors.state?.message} {...register("state")} />
      </div>
      <Input
        label="Pincode"
        icon={Hash}
        iconColor="gray"
        inputMode="numeric"
        maxLength={6}
        placeholder="6-digit pincode"
        autoComplete="postal-code"
        error={errors.pincode?.message}
        {...register("pincode")}
      />

      {!address?.isDefault && (
        <label className="flex cursor-pointer items-center gap-3 px-1 py-2 text-sm text-ink">
          <span className="relative grid size-6 shrink-0 place-items-center">
            <input
              type="checkbox"
              className="peer size-6 cursor-pointer appearance-none rounded-md border-2 border-ink/25 bg-surface transition checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...register("isDefault")}
            />
            <Check aria-hidden className="pointer-events-none absolute size-4 text-ink opacity-0 peer-checked:opacity-100" strokeWidth={3} />
          </span>
          Make this my default delivery address
        </label>
      )}

      {formError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" pending={isSubmitting} className="mt-2 w-full">
        <MapPinned aria-hidden className="size-5" />
        {address ? "Update Address" : "Save Address"}
      </Button>
    </form>
  );
}
