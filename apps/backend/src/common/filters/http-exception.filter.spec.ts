import { ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

function hostWith(json: ReturnType<typeof vi.fn>, status = vi.fn()) {
  status.mockReturnValue({ json });
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', url: '/boom' }),
    }),
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('keeps 404 as 404', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    filter.catch(new NotFoundException('Project not found'), hostWith(json, status));
    expect(status).toHaveBeenCalledWith(404);
    expect(json.mock.calls[0][0].stack).toBeUndefined();
  });

  it('maps unknown errors to 500 without stack', () => {
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    filter.catch(new Error('driver blew up'), hostWith(json, status));
    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body).toMatchObject({
      statusCode: 500,
      path: '/boom',
      message: 'Internal server error',
    });
    expect(body.timestamp).toEqual(expect.any(String));
    expect(body.stack).toBeUndefined();
    expect(errorSpy.mock.calls[0][0]).toContain('driver blew up');
    errorSpy.mockRestore();
  });
});
