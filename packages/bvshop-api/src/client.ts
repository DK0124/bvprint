import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  BvOrder,
  BvOrderDetail,
  CreateLabelInput,
  ListOrdersParams,
  Paginated,
} from './types.js';

export class BvshopApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: 'AUTH_ERROR' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'UNKNOWN',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'BvshopApiError';
  }
}

export interface BvshopApiClientOptions {
  baseUrl?: string;
  token: string;
}

export class BvshopApiClient {
  private readonly http: AxiosInstance;

  constructor({
    baseUrl = process.env.BVSHOP_API_BASE ?? 'https://bvshop-manage.bvshop.tw/api/v2',
    token,
  }: BvshopApiClientOptions) {
    this.http = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json',
      },
    });
  }

  async listOrders(params: ListOrdersParams = {}): Promise<Paginated<BvOrder>> {
    const response = await this.safeRequest<Paginated<BvOrder>>(() =>
      this.http.get('/orders', {
        params: { withDetail: 1, ...params },
      }),
    );
    return response;
  }

  async getOrder(id: number | string): Promise<BvOrderDetail> {
    const response = await this.safeRequest<{ data: BvOrderDetail }>(() => this.http.get(`/orders/${id}`));
    return response.data;
  }

  async listLogistics(): Promise<unknown> {
    return this.safeRequest(() => this.http.get('/logistics'));
  }

  async listPayments(): Promise<unknown> {
    return this.safeRequest(() => this.http.get('/payments'));
  }

  async createEcpayLabel(input: CreateLabelInput): Promise<{ html: string }> {
    return this.sendMultipart('/order-logistic/ecpay', input);
  }

  async createPayuniLabel(input: CreateLabelInput): Promise<{ html: string }> {
    return this.sendMultipart('/order-logistic/payuni', input);
  }

  async createTcatLabel(input: CreateLabelInput): Promise<{ pdf: string }> {
    return this.sendMultipart('/order-logistic/tcat', input);
  }

  async createSfLabel(input: CreateLabelInput): Promise<{ printUrl: string }> {
    return this.sendMultipart('/order-logistic/sf', input);
  }

  private async sendMultipart<T>(path: string, input: CreateLabelInput): Promise<T> {
    const formData = new FormData();
    formData.append('id', String(input.id));
    formData.append('senderName', input.senderName);
    formData.append('senderPhone', input.senderPhone);

    return this.safeRequest<T>(() =>
      this.http.post(path, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    );
  }

  private async safeRequest<T>(request: () => Promise<{ data: T }>): Promise<T> {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): BvshopApiError {
    if (!(error instanceof AxiosError)) {
      return new BvshopApiError('未知錯誤', undefined, 'UNKNOWN');
    }

    const status = error.response?.status;
    const details = error.response?.data;
    const messageFromApi =
      typeof details === 'object' && details && 'message' in details
        ? String((details as { message?: unknown }).message)
        : error.message;

    switch (status) {
      case 401:
        return new BvshopApiError(messageFromApi || 'BVSHOP Token 驗證失敗', status, 'AUTH_ERROR', details);
      case 404:
        return new BvshopApiError(messageFromApi || '找不到資料', status, 'NOT_FOUND', details);
      case 422:
        return new BvshopApiError(messageFromApi || '欄位驗證錯誤', status, 'VALIDATION_ERROR', details);
      case 500:
        return new BvshopApiError(messageFromApi || 'BVSHOP 伺服器錯誤', status, 'SERVER_ERROR', details);
      default:
        return new BvshopApiError(messageFromApi || 'BVSHOP API 錯誤', status, 'UNKNOWN', details);
    }
  }
}
