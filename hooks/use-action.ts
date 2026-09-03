"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ActionState, FieldErrors } from "@/lib/create-safe-action";

type Action<TInput, TOutput> = (
  data: TInput
) => Promise<ActionState<TInput, TOutput>>;

type useActionOptions<TOutput> = {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
};

export const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options: useActionOptions<TOutput> = {}
) => {
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<TInput> | undefined
  >(undefined);

  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true);

      try {
        const result = await action(input);

        if (!result) return;

        setFieldErrors(result.fieldErrors);

        if (result.error) {
          setError(result.error);
          options.onError?.(result.error);
        }

        if (result.data) {
          setData(result.data);
          options.onSuccess?.(result.data);
          queryClient.invalidateQueries({ queryKey: ["org-stats"] });
          queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["daily-activity"] });
        }
      } finally {
        setIsLoading(false);
        options.onComplete?.();
      }
    },
    [action, options, queryClient]
  );

  return {
    execute,
    fieldErrors,
    error,
    data,
    isLoading,
  };
};
