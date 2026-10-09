import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultWeights, type Factors } from "@/lib/scorebdp/contracts";
import {
  calculateScore,
  contribution,
  scoreLetter,
  validateWeights,
} from "@/lib/scorebdp/scoring";
import { normalizeEvaluation } from "@/lib/scorebdp/api-repository";
import { demoRepository } from "@/lib/scorebdp/demo-repository";
import { allowedEndpoint } from "@/lib/scorebdp/proxy";
import {
  emptyApplication,
  emptySupplement,
  financialIndicators,
  validateApplication,
} from "@/features/formulario/validation";
import { GET } from "@/app/api/scorebdp/[...path]/route";
const factors: Factors = {
  perfil_financiero: 0.8,
  viabilidad: 0.6,
  adopcion: 0.5,
  mercado: 0.8,
  riesgo_climatico: 0.3,
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Score de demostración", () => {
  it("produce 760 con los pesos 70/5/5/5/15", () => {
    expect(calculateScore(factors, defaultWeights)).toBe(760);
    expect(scoreLetter(760)).toBe("B");
    expect(contribution("riesgo_climatico", 0.3, 15)).toBe(105);
  });
  it("no transforma clima faltante en aporte máximo", () => {
    expect(
      calculateScore({ ...factors, riesgo_climatico: null }, defaultWeights),
    ).toBeNull();
  });
  it("rechaza factores fuera de rango y pesos incoherentes", () => {
    expect(() =>
      calculateScore({ ...factors, viabilidad: 1.2 }, defaultWeights),
    ).toThrow();
    expect(validateWeights({ ...defaultWeights, perfil_financiero: 80 })).toBe(
      false,
    );
    expect(() =>
      calculateScore(factors, { ...defaultWeights, mercado: NaN }),
    ).toThrow();
  });
  it("mantiene los límites de escala", () => {
    const zero = {
      perfil_financiero: 0,
      viabilidad: 0,
      adopcion: 0,
      mercado: 0,
      riesgo_climatico: 1,
    };
    expect(calculateScore(zero, defaultWeights)).toBe(0);
    expect(
      calculateScore(
        {
          ...zero,
          perfil_financiero: 1,
          viabilidad: 1,
          adopcion: 1,
          mercado: 1,
          riesgo_climatico: 0,
        },
        defaultWeights,
      ),
    ).toBe(1000);
  });
});
describe("API institucional", () => {
  const response = {
    score: {
      idsolicitud: 7,
      scorefinanciero: 0.8,
      scoreviabilidad: 0.6,
      scoreadopcion: 0.5,
      scoremercado: 0.8,
      scoreclima: 0.3,
      score: 760,
      scoreletra: "B",
    },
    pesos: defaultWeights,
  };
  it("conserva el resultado y pesos de la API", () => {
    expect(normalizeEvaluation(response, 7).score).toBe(760);
    expect(normalizeEvaluation(response, 7).source).toBe("API");
  });
  it("rechaza resultados de otra solicitud", () => {
    expect(() => normalizeEvaluation(response, 8)).toThrow();
  });
  it("rechaza factores fuera de rango, sin recortarlos", () => {
    expect(() =>
      normalizeEvaluation(
        { ...response, score: { ...response.score, scoreclima: 2 } },
        7,
      ),
    ).toThrow();
  });
  it("limita el proxy a las operaciones previstas", () => {
    expect(allowedEndpoint("POST", "score/generate/7")).toBe(true);
    expect(allowedEndpoint("GET", "municipios")).toBe(true);
    expect(allowedEndpoint("DELETE", "F_SCO_PERSONAS/1")).toBe(false);
    expect(allowedEndpoint("POST", "../pesos")).toBe(false);
  });
  it("bloquea las llamadas al backend en DEMO", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "demo");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await GET(
      new Request("http://localhost/api/scorebdp/solicitudes"),
      { params: Promise.resolve({ path: ["solicitudes"] }) },
    );
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("reporta fallo API sin sustituirlo por DEMO", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "api");
    vi.stubEnv("SCOREBDP_API_URL", "http://scorebdp.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const response = await GET(
      new Request("http://localhost/api/scorebdp/solicitudes"),
      { params: Promise.resolve({ path: ["solicitudes"] }) },
    );
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toEqual(expect.any(String));
    expect(body.error.length).toBeGreaterThan(0);
    expect(body).not.toHaveProperty("data");
    expect(body).not.toHaveProperty("score");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
describe("Captura y aislamiento de datos", () => {
  it("no inventa factores para solicitudes nuevas y persiste el listado de sesión", async () => {
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    const id = await demoRepository.create({
      ...emptyApplication,
      nombre: "Prueba",
      monto: 2000,
    });
    expect(id).toBe(2);
    expect((await demoRepository.list(id))[0].nombre).toBe("Prueba");
    expect((await demoRepository.evaluate(id)).score).toBeNull();
    expect((await demoRepository.evaluate(1)).score).toBe(760);
  });
  it("no descuenta el saldo de deuda como si fuera una cuota mensual", () => {
    const indicators = financialIndicators({
      ...emptySupplement,
      ingresos: "5000",
      egresos: "2000",
      cuota: "1000",
      cuotasExistentes: "500",
      deuda: "10000",
    });
    expect(indicators.available).toBe(3000);
    expect(indicators.payments).toBe(1500);
    expect(indicators.remaining).toBe(1500);
    expect(indicators.ratio).toBe(0.5);
  });
  it("no divide por ingreso disponible cero ni trata vacíos como ceros", () => {
    expect(financialIndicators(emptySupplement).remaining).toBeNull();
    expect(
      financialIndicators({
        ...emptySupplement,
        ingresos: "1000",
        egresos: "1000",
        cuota: "200",
        cuotasExistentes: "0",
      }).ratio,
    ).toBeNull();
  });
  it("valida mayor de edad, monto y mes", () => {
    expect(
      validateApplication(
        {
          ...emptyApplication,
          fechanac: "2020-01-01",
          monto: -1,
          messiembra: "13",
        },
        new Date("2026-09-30T12:00:00Z"),
      ).length,
    ).toBeGreaterThan(0);
  });
});
