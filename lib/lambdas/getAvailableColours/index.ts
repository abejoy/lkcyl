import { AllColours, HttpResponse } from "../getAllTeams";


type ColorResponse = {
  colorName: string,
  available: boolean
}



export const handler = async (event: any): Promise<HttpResponse|null> => {
    const data = JSON.parse(event?.body);
    const allAvailableColours = Object.values(AllColours) as string[];
    const toret = allAvailableColours.map(colorName => ({
      colorName,
      available: true
    }));
    return null;
}