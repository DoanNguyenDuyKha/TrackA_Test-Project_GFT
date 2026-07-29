const { fallbackGrading } = require('../routes/grading');

const userEssay = `Nowadays, environmental problems are becoming more serious in many countries. Some people believe that governments should stop spending money on fossil fuels and use all subsidies for solar and wind energy instead. I partly disagree with this idea because renewable energy should receive more support, but fossil fuels are still necessary for many countries.

On the one hand, governments should spend more money on solar and wind energy because they are cleaner than fossil fuels. Coal, oil and gas produce a lot of pollution and carbon dioxide, which can cause global warming and climate change. In contrast, solar and wind power can produce electricity without creating as much pollution. If governments give more financial support to renewable energy, more companies may invest in solar panels and wind farms. This can help countries reduce pollution and protect the environment in the future.

On the other hand, stopping all subsidies for fossil fuels may cause some problems. Many countries still depend on coal, oil and gas for electricity, transportation and industry. It is difficult to replace these energy sources in a short time. Moreover, solar and wind energy depend on weather conditions. Solar panels produce less electricity when there is little sunlight, while wind turbines cannot work effectively without enough wind. Therefore, if governments stop supporting fossil fuels too quickly, energy prices may increase and some people may have difficulty paying their electricity bills.

In my opinion, governments should gradually reduce financial support for fossil fuels and spend more money on developing renewable energy. However, this change should happen slowly so that people and businesses have enough time to adapt.

In conclusion, solar and wind energy are important for protecting the environment, and governments should invest more in them. However, I do not think all fossil fuel subsidies should be stopped immediately because many countries still need these energy sources.`;

const result = fallbackGrading(userEssay, {});
console.log('RESULT_OUTPUT_START');
console.log(JSON.stringify(result, null, 2));
console.log('RESULT_OUTPUT_END');
