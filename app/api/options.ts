import axios from 'axios';
import { toast } from "@/components/ui/use-toast"

// Explicitly type the response from the API
type OptionSymbols = {
    atmCall: string;
    atmPut: string;
  };
  
  type OptionPrices = {
    [symbol: string]: number;
  };


type OrderType = 'MKT' | 'LMT' | 'SL-LMT';


  export async function fetchOptionSymbols(): Promise<OptionSymbols> {
    try {
      console.log('Fetching option symbols...');
      const response = await fetch('http://localhost:8090/api/atmSymbols');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched option symbols:', data);
      return data;
    } catch (error) {
      console.error('Error fetching option symbols:', error);
      throw error;
    }
  }
  
  export async function fetchOptionPrices(symbols: OptionSymbols): Promise<OptionPrices> {
    try {
      console.log('Fetching option prices for symbols:', symbols);
      const propertyName1 = 'atmCall';
      const propertyName2 = 'atmPut';

      const atmCall = symbols[propertyName1];
      const atmPut = symbols[propertyName2];
      
      console.log(atmCall);
      console.log(atmPut);

    const symbolsString = `${symbols.atmCall},${symbols.atmPut}`;

      console.log('got symbols:', symbolsString);
      const response = await fetch(`http://localhost:8090/api/atmPrice/${symbolsString}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched option prices:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching option prices:', error);
      throw error;
    }
  }

export const buyOption = async (
  type: 'call' | 'put',
  orderType: OrderType,
  price: string,
  symbol: string,
  setIsLoading: (value: React.SetStateAction<{ [key: string]: boolean }>) => void
) => {
  setIsLoading(prev => ({ ...prev, buyOrder: true }));

  if ((orderType === 'LMT' || orderType === 'SL-LMT') && !price) {
    toast({
      title: "Error",
      description: "Price cannot be empty for Limit or Stop Limit orders.",
      variant: "destructive",
    });
    setIsLoading(prev => ({ ...prev, buyOrder: false }));
    return;
  }

  try {
    const response = await axios.post(`http://localhost:8090/api/buyOrder/${symbol}/${orderType}/${price || 0}`);
    console.log(response.status);
    const responseBody = response.data;

    if (response.status === 200) {
      // toast({
      //   title: "Option Purchased",
      //   description: `You have placed a ${orderType} ${type} order ${orderType !== 'MKT' ? `at ₹${price}` : ''}.`,
      //   duration: 5000,
      // });
    } else if (response.status === 406) {
      toast({
        title: "Not Allowed",
        description: `You have placed a buy order too soon. Wait for ${responseBody} minutes.`,
        duration: 5000,
      });
    }
  } catch (error: any) {
    console.log(error);
    if (error.response?.status === 406) {
      toast({
        title: "Not Allowed",
        description: `You have placed a buy order too soon. Wait for ${error.response.data} more minutes.`,
        duration: 5000,
      });
    } else {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  } finally {
    setIsLoading(prev => ({ ...prev, buyOrder: false }));
  }
};
