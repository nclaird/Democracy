export interface StreamEntry {
  date: Date;
  value: number;
  normValue: number;
}

export interface Stream {
  name: string;
  values: StreamEntry[];
}

export function valueOnDate(stream: Stream, date: Date): number {
  let entry = stream.values.filter( entry => entry.date.toString() == date.toString() )[ 0 ];
  return entry ? entry.normValue : null;
}


export interface SelectedComponent {
  streamName: string;
  weight: number;

}

export interface Headline {
  date: Date,
  headline: string
}