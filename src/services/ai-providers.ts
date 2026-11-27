import type {
  AiPurpose,
  AiProviderName,
  AiProvidersState,
  AiModelConfigPayload,
  AiProviderTestResult,
  AiProviderTestPayload,
  AiProviderUpdatePayload,
} from 'src/types/services/ai-providers';

import { ApiService } from './api/api';

// ----------------------------------------------------------------------

/** Provedores de IA e cadeia de modelos por finalidade (global da plataforma, só SuperAdmin). */
export class AiProviderService {
  static list(): Promise<AiProvidersState> {
    return ApiService.get<AiProvidersState>('/ai/providers');
  }

  static update(provider: AiProviderName, payload: AiProviderUpdatePayload): Promise<AiProvidersState> {
    return ApiService.put<AiProviderUpdatePayload, AiProvidersState>(`/ai/providers/${provider}`, payload);
  }

  static removeKey(provider: AiProviderName): Promise<AiProvidersState> {
    return ApiService.delete<AiProvidersState>(`/ai/providers/${provider}/key`);
  }

  static test(provider: AiProviderName, payload: AiProviderTestPayload = {}): Promise<AiProviderTestResult> {
    return ApiService.post<AiProviderTestPayload, AiProviderTestResult>(
      `/ai/providers/${provider}/test`,
      payload
    );
  }

  static saveModelConfig(purpose: AiPurpose, payload: AiModelConfigPayload): Promise<AiProvidersState> {
    return ApiService.put<AiModelConfigPayload, AiProvidersState>(`/ai/model-config/${purpose}`, payload);
  }
}
